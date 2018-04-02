import { Tasks } from '/imports/api/tasks/tasks';
import { getTimeZoneNameFromCoordinatesForUsers } from '/imports/api/google-services/google-api/methods';

import './completed.html';


Template.compleatedTasks.onCreated(function () {
    let self = this;
    this.query = new ReactiveVar({});
    this.params = new ReactiveVar({});
    this.taskId = new ReactiveVar('');
    this.timeZones = new ReactiveVar([]);
    this.limit = new ReactiveVar(10);

    this.getUserCoordinates = function (projectId) {
        let tasks = Tasks.find({projectId: projectId, status: 'Closed'}).fetch();
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
        let query = {};
        let limit = this.limit.get();
        query.projectId = data.project._id;
        query.$or = [ { membersIds:  Meteor.userId()}, { ownerId: Meteor.userId()} ];
        query.status = 'Closed';
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
        let data = Template.currentData();
        let query = this.query.get();
        let params = this.params.get();
        this.subscribe('tasksByType', query, params);
        this.getUserCoordinates(data.project._id);
    });
});

Template.compleatedTasks.onRendered(function () {
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
Template.compleatedTasks.helpers({
    completedTasks() {
        let tmpl = Template.instance();
        let query = tmpl.query.get();
        let params = tmpl.params.get();
        return Tasks.find(query, params).fetch();
    },
    taskTimeTracked() {
      return this.trackingInfo ? parseInt(this.trackingInfo.allUsers.allTime.tracked / 1000): 0
    },
    taskTimeHardLimit() {
      return this.hardLimit ? parseInt(this.hardLimit / 1000): 0
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

Template.compleatedTasks.events({
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
    },
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
    }
});
