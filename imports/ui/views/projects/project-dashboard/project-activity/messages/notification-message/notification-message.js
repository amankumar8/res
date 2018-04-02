import { Projects } from '/imports/api/projects/projects';
import './notification-message.html';

Template.notificationMessage.helpers({
    status() {
        let messageType = this.type;
        let status;
        if(messageType == 'user-changes-message'){
            let changedUsersIdsLength = this.changedUsersIds && this.changedUsersIds.length || 0;
            let message = changedUsersIdsLength > 1 ? 'User\'s' : 'User';
            if(this.message == 'users-added'){
                status = message + ' added to project';
            }
            else if(this.message == 'users-removed'){
                status = message + ' removed from project';
            }
        }
        else if(messageType == 'project-created-message'){
            status = 'Project created'
        }

        return status;
    },
    notification() {
        let messageType = this.type;
        if(messageType == 'user-changes-message') {
            let changedUsersIds = this.changedUsersIds || [];
            let users = Meteor.users.find({_id: {$in: changedUsersIds}}).fetch();
            let userNames = [];
            _.each(users, function (user) {
                userNames.push(user.profile.fullName);
            });
            userNames = userNames.join().replace(',', ', ');
            if (this.message == 'users-added') {
                return userNames + ' added to project';
            }
            else if (this.message == 'users-removed') {
                return userNames + ' removed from project';

            }
        }
        else if(messageType == 'project-created-message'){
            let projectId = this.projectId;
            let projectOwnerId = this.projectOwner;
            let project = Projects.findOne({_id: projectId});
            let projectOwner = Meteor.users.findOne({_id: projectOwnerId}, {fields: {profile: 1}});
            let projectName = project && project.name;
            let ownerName = projectOwner && projectOwner.profile.fullName;
            return 'Project '+projectName + ' was created by '+ownerName;
        }
    },
    isFirst() {
        let projectId = this.projectId;
        let messageId = this._id;
        let currentProject = Projects.findOne({_id: projectId});
        let activityMessagesIds = currentProject && currentProject.activityMessagesIds;
        let lastMessageId = _.last(activityMessagesIds);
        if(lastMessageId) {
            return messageId == lastMessageId ? 'first' : '';
        }
    }
});