import { VZ } from '/imports/startup/both/namespace';
import { Projects } from '/imports/api/projects/projects';
import { Tasks } from '/imports/api/tasks/tasks';
import { addUserToTask, removeUserFromTask } from '/imports/api/tasks/methods';

import './assign-users-modal.html';

Template.assignUsersModal.onCreated(function () {
    this.assignedToTaskUsersIds = new ReactiveVar([]);
    this.canBeAssignedUsersIds = new ReactiveVar([]);
    this.searchString = new ReactiveVar('');

    this.setTaskUsers = (taskId, projectId, newTaskUserIds) => {
        let project = Projects.findOne({_id: projectId});
        let assignedUsersIds = project && project.assignedUsersIds || [];
        let users = {};
        if (taskId && taskId != 'new-task') {
            let task = Tasks.findOne({_id: taskId});
            let membersIds = task && task.membersIds || [];

            let canBeAssignedIds = _.difference(assignedUsersIds, membersIds);
            users.assignedToTaskUsersIds = membersIds;
            users.canBeAssignedUsersIds = canBeAssignedIds || [];
        }
        else if(taskId && taskId === 'new-task'){
            let canBeAssignedIdsNew = _.difference(assignedUsersIds, newTaskUserIds);
            users.assignedToTaskUsersIds = newTaskUserIds || [];
            users.canBeAssignedUsersIds = canBeAssignedIdsNew || [];
        }
        else {
            users.assignedToTaskUsersIds = [];
            users.canBeAssignedUsersIds = assignedUsersIds;
        }

        this.assignedToTaskUsersIds.set(users.assignedToTaskUsersIds);
        this.canBeAssignedUsersIds.set(users.canBeAssignedUsersIds);
    };

    this.autorun(() => {
        let data = Template.currentData();
        let projectId = data.projectId;
        let taskId = data.taskId;
        let newTaskUserIds = data.newTaskUserIdsVar.get();
        this.setTaskUsers(taskId, projectId, newTaskUserIds);
    });

    this.autorun(() => {
        this.assignedToTaskUsersIds.get();
        this.canBeAssignedUsersIds.get();
    });
});
Template.assignUsersModal.onRendered(function () {
    let self = this;

    this.$('.modal').modal();
    this.$('.modal').modal('open');
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
});
Template.assignUsersModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.assignUsersModal.helpers({
    assignedUsers() {
        let tmpl = Template.instance();
        let assignedToTaskUsersIds = tmpl.assignedToTaskUsersIds.get();
        let canBeAssignedUsersIds = tmpl.canBeAssignedUsersIds.get();
        let searchString = tmpl.searchString.get();
        let regex = new RegExp(searchString, 'gi');

        let assignedToTaskUsers = Meteor.users.find({
            _id: {$in: assignedToTaskUsersIds},
            $or: [{'profile.fullName': {$regex: regex}}, {'emails.address': {$regex: regex}}]
        }, {fields: {profile: 1, emails: 1}}).fetch();

        let canBeAssignedUsers = Meteor.users.find({
            _id: {$in: canBeAssignedUsersIds},
            $or: [{'profile.fullName': {$regex: regex}}, {'emails.address': {$regex: regex}}]
        }, {fields: {profile: 1, emails: 1}}).fetch();

        return {assignedToTaskUsers: assignedToTaskUsers, canBeAssignedUsers: canBeAssignedUsers};
    }
});

Template.assignUsersModal.events({
    'click #remove-user': function (event, tmpl) {
        let selectedUserId = this._id;
        let taskId = tmpl.data.taskId;
        let projectId = tmpl.data.projectId;
        let assignedToTaskUsersIds = _.clone(tmpl.assignedToTaskUsersIds.get());
            if (taskId == 'new-task') {
                tmpl.data.onUserAssignRemoveUserCb(selectedUserId, 'remove');
            }
            else {
                removeUserFromTask.call({userId:selectedUserId, taskId:taskId, projectId:projectId}, (err, res) => {
                    if (err) {
                        let message = err.reason || err.message;
                        VZ.notify(message);
                    } else {
                        assignedToTaskUsersIds = _.reject(assignedToTaskUsersIds, function (userId) {
                            return userId == selectedUserId;
                        });
                        tmpl.assignedToTaskUsersIds.set(assignedToTaskUsersIds);
                    }
                });
            }
    },
    'click #add-user': function (event, tmpl) {
        let selectedUserId = this._id;
        let taskId = tmpl.data.taskId;
        let projectId = tmpl.data.projectId;
        let canBeAssignedUsersIds = _.clone(tmpl.canBeAssignedUsersIds.get());
            if (taskId == 'new-task') {
                tmpl.data.onUserAssignRemoveUserCb(selectedUserId, 'assign');
            }
            else {
                addUserToTask.call({userId:selectedUserId, taskId:taskId, projectId:projectId}, (err, res) => {
                    if (err) {
                        let message = err.reason || err.message;
                        VZ.notify(message);
                    } else {
                        canBeAssignedUsersIds = _.reject(canBeAssignedUsersIds, function (userId) {
                            return userId == selectedUserId;
                        });
                        tmpl.canBeAssignedUsersIds.set(canBeAssignedUsersIds);
                    }
                });
            }
    },
    'input #search-string': _.debounce(function (event, tmpl) {
        setTimeout(function () {
            let searchString = $(event.currentTarget).val();
            tmpl.searchString.set(searchString);
        }, 50)
    }, 100)
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};