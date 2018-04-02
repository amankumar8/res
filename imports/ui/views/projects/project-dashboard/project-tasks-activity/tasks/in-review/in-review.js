import { VZ } from '/imports/startup/both/namespace';
import { Tasks } from '/imports/api/tasks/tasks';
import {changeTaskStatus} from '/imports/api/tasks/methods';
import { getTimeZoneNameFromCoordinatesForUsers } from '/imports/api/google-services/google-api/methods';
import './in-review.html';


Template.inReview.onCreated(function () {
    let self = this;
    this.query = new ReactiveVar({});
    this.params = new ReactiveVar({});
    this.taskId = new ReactiveVar('');
    this.timeZones = new ReactiveVar([]);
    this.newTaskUserIds = new ReactiveVar([]);
    this.newTaskFiles = new ReactiveVar([]);
    this.limit = new ReactiveVar(10);

    this.getUserCoordinates = (projectId) => {
        let tasks = Tasks.find({projectId: projectId, status: 'In-review'}).fetch();
        let tasksUsersIds = _.map(tasks, function (task) {
            return task.membersIds;
        });
        tasksUsersIds = _.union(_.flatten(tasksUsersIds, true));
        let users = Meteor.users.find({_id: {$in: tasksUsersIds}}).fetch();
        let usersWitlLocation = _.filter(users, function (user) {
            let userProfile = user.profile || {};
            return _.has(userProfile, 'location');
        });
        getTimeZoneNameFromCoordinatesForUsers.call(usersWitlLocation, function (error, result) {
            if (!error) {
                self.timeZones.set(result);
            }
        });
    };
    this.autorun(() => {
        let data = Template.currentData();
        let limit = this.limit.get();
        let query = {};
        query.projectId = data.project._id;
        query.archived = false;
        query.status = 'In-review';
        if(data.project.ownerId != Meteor.userId()){
            query.$or = [ { membersIds:  Meteor.userId()}, { ownerId: Meteor.userId()} ];
        }
        this.params.set({sort: {createdAt: -1}, limit: limit});
        this.query.set(query);
    });
    this.autorun(() => {
        let taskId = Router.current().params.query.task;
        if (taskId && taskId != 'new-task') {
            this.taskId.set(taskId);
        }
    });
    this.autorun(() => {
        let taskId = this.taskId.get();
        let data = Template.currentData();
        let projectId = data.project._id;
        let tasksTab = Router.current().params.query.tasks;
        let query = {projectId: projectId};
        if(data.project.ownerId  != Meteor.userId()){
            query.$or = [ { membersIds:  Meteor.userId()}, { ownerId: Meteor.userId()} ];
        }
        Tasks.find(query).observe({
            changed: function (newTask, oldTask) {
                let statusChnaged = oldTask.status == newTask.status;
                if(taskId == oldTask._id && !statusChnaged){
                    self.taskId.set('');
                    Router.go('projectDashboard', {id: projectId, tab: 'tasks'}, {query: {tasks: tasksTab}});
                }
            }
        });
        this.getUserCoordinates(projectId);
    });
    this.autorun(() => {
        let query = this.query.get();
        let params = this.params.get();
        this.subscribe('tasksByType', query, params);
    });
});

Template.inReview.onRendered(function () {
    let self = this;
    this.$('ul.tabs').tabs();
    this.$('.dropdown-button').dropdown();

    let loadOnScroll = _.debounce(function () {
        if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight && self.limit.get() < Counts.get('assigned')) {
            self.limit.set(self.limit.get() + 5);
        }
    }, 700);

    this.$('#scroll').on('scroll', loadOnScroll);
});
Template.inReview.helpers({
    inReviewTasks() {
        let tmpl = Template.instance();
        let query = tmpl.query.get();
        let params = tmpl.params.get();

        return Tasks.find(query, params).fetch();
    },
    taskTimeTracked() {
      return this.trackingInfo ? parseInt(this.trackingInfo.allUsers.allTime.tracked / 1000): 0
    },
    taskMembersCount(membersIds) {
        return membersIds && membersIds.length || 0;
    },
    taskId() {
        return Template.instance().taskId.get();
    },
    task() {
        let taskId = Template.instance().taskId.get();
        return taskId ? Tasks.findOne({_id: taskId}) : {};
    },
    formatTime(timeToFormat) {
        return moment(new Date(timeToFormat)).fromNow();
    },
    taskTimeHardLimit() {
        return this.hardLimit ? parseInt(this.hardLimit / 1000): 0
    },
    membersCount() {
        if(this.membersIds){
            return this.membersIds.length;
        }
        return 0;
    },
    taskFilesCount() {
        if(this.taskFiles){
            return this.taskFiles.length;
        }
        return 0;
    },
    isTaskSelected(id) {
        let tasksTab = Template.instance().taskId.get();
        return tasksTab == id ? 'active' : '';
    },
    taskHaveUsers() {
        return this.membersIds && this.membersIds.length > 0;
    },
    isInReview() {
        return this.status == 'In-review';
    },
    userTaskRole(isRole) {
        let membersIds = this.membersIds;
        let ownerId = this.ownerId == Meteor.userId();
        let isTaskMember = _.find(membersIds, function (memberId) {
            return memberId == Meteor.userId();
        });
        if(isRole == 'member'){
            return isTaskMember && !ownerId;
        }
        else if(isRole == 'owner'){
            return !isTaskMember && ownerId;
        }
        else if(isRole == 'ownerAndMember'){
            return isTaskMember && ownerId;
        }
        else {
            return false;
        }
    },
    isSortedBy(sortParam) {
        let params = Template.instance().params.get();
        return _.has(params.sort, sortParam);
    },
    userUpdated() {
        let editedBy = this.editedBy || '';
        let user = Meteor.users.findOne({_id: editedBy});
        return user && user.profile && user.profile.fullName;
    },
    userProfile() {
        let id = this.toString();
        let timeZones = Template.instance().timeZones.get();
        let user = Meteor.users.findOne({_id: id});
        let profile = user && user.profile;
        if (profile) {
            let userProfile = {
                photo: profile.photo.large,
                fullName: profile.fullName,
                location: profile.location && profile.location.locality + ', ' + profile.location.country || '',
                lastOnline: profile.lastOnline && profile.lastOnline.toString() || false,
                status: profile.online || false
            };
            _.each(timeZones, function (timeZone) {
                if(timeZone.userId == user._id){
                    userProfile.localTime = moment.tz(timeZone.timeZoneId).format('hh:mm a');
                }
            });
            return userProfile;
        }
    },
    totalSpent() {
      return this.trackingInfo ? this.trackingInfo.allUsers.allTime.earned.toFixed(2) : 0;
    }
});

Template.inReview.events({
    'click .tab-single': function (event, tmpl) {
        event.preventDefault();
        event.stopPropagation();

      let taskId = $(event.currentTarget).prop('id').replace('task-item-','');
        let projectId = Router.current().params.id;
        let tabName = Router.current().params.tab;
        let tasksTab = Router.current().params.query.tasks;
        tmpl.taskId.set(taskId);

        if(taskId && taskId != 'new-task'){
            Router.go('projectDashboard', {id: projectId, tab: tabName}, {query: {tasks: tasksTab, task: taskId}});
        }
        else {
            Router.go('projectDashboard', {id: projectId, tab: tabName}, {query: {tasks: tasksTab}});

        }
    },
    'click #task-users-count': function (event, tmpl) {
        event.preventDefault();
        let projectId = tmpl.data.project._id;
        let taskId = tmpl.taskId.get();
        let newTaskUserIds = tmpl.newTaskUserIds.get();
        let newTaskUserIdsVar = tmpl.newTaskUserIds;
        let parentNode = $('body')[0],
            onUserAssignRemoveUserCb = function (userId, action) {
                if (action == 'assign') {
                    newTaskUserIds.push(userId);
                    tmpl.newTaskUserIds.set(newTaskUserIds);
                }
                else if (action == 'remove') {
                    newTaskUserIds = _.reject(newTaskUserIds, function (id) {
                        return id == userId;
                    });
                    tmpl.newTaskUserIds.set(newTaskUserIds);
                }
            },
            modalData = {
                projectId: projectId,
                taskId: taskId,
                newTaskUserIdsVar: newTaskUserIdsVar,
                onUserAssignRemoveUserCb: onUserAssignRemoveUserCb
            };
        Blaze.renderWithData(Template.assignUsersModal, modalData, parentNode);
    },
    'click #task-files-count': function (event, tmpl) {
        event.preventDefault();
        let projectId = tmpl.data.project._id;
        let taskId = tmpl.taskId.get();
        let newTaskFiles = tmpl.newTaskFiles.get();
        let newTaskFilesVar = tmpl.newTaskFiles;
        let parentNode = $('body')[0],
            onAddFilesCb = function (file) {
                newTaskFiles.push(file);
                tmpl.newTaskFiles.set(newTaskFiles);
            },
            modalData = {
                projectId: projectId,
                taskId: taskId,
                newTaskFilesVar: newTaskFilesVar,
                onAddFilesCb: onAddFilesCb
            };
        Blaze.renderWithData(Template.taskAttachmentsModal, modalData, parentNode);
    },
    'click #complete-task': _.debounce(function (event, tmpl) {
        let taskId = this._id;
        let tasksTab = Router.current().params.query.tasks;
        let projectId = Router.current().params.id;

        changeTaskStatus.call({taskId:taskId, status:'Closed'}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                VZ.notify(message);
            } else {
                tmpl.taskId.set('');
                Router.go('projectDashboard', {id: projectId, tab: 'tasks'}, {query: {tasks: tasksTab}});
            }
        });
    },100),
    'click #deny-task': _.debounce(function (event, tmpl) {
        let taskId = this._id;
        let tasksTab = Router.current().params.query.tasks;
        let projectId = Router.current().params.id;

        changeTaskStatus.call({taskId:taskId, status:'Opened'}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                VZ.notify(message);
            } else {
                tmpl.taskId.set('');
                Router.go('projectDashboard', {id: projectId, tab: 'tasks'}, {query: {tasks: tasksTab}});
            }
        });
    },100),
    'change input[type=radio]': function (event, tmpl) {
        let id = tmpl.$(event.target).prop('id');
        if (id == 'last-updated') {
            tmpl.params.set({sort: {editedAt: -1}});
        }
        else if (id == 'alphabetically') {
            tmpl.params.set({sort: {name: 1}});
        }
        else if (id == 'date-created') {
            tmpl.params.set({sort: {createdAt: -1}});
        }
    },
    'input #task-name': function (event, tmpl) {
        event.preventDefault();
        let searchString = tmpl.$(event.currentTarget).val();
        let query = tmpl.query.get();
        if (searchString != '') {
            query.name = {$regex: searchString, $options: 'gi'};
        }
        else {
            query = _.omit(query, 'name');
        }
        tmpl.query.set(query);
    }
});
