import { VZ } from '/imports/startup/both/namespace';
import { Projects } from '/imports/api/projects/projects';
import { ActivityMessages } from '/imports/api/activityMessages/activityMessages';
import { addActivityReplyMessage } from '/imports/api/activityMessages/methods';

import './project-activity-message.html';

Template.projectActivityMessage.onCreated(function () {

});

Template.projectActivityMessage.helpers({
    profilePhoto() {
        let userId = this.userId;
        let user = Meteor.users.findOne({_id: userId}, {
            fields: {profile: 1}
        });
        if (!user || !user.profile) {
            return;
        }
        if (!user.profile.photo || !user.profile.photo.small) {
            return '/images/default-lockout.png'
        }

        return user.profile.photo.small;
    },
    authorName() {
        let userId = this.userId;
        let user = Meteor.users.findOne({_id: userId}, {
            fields: {profile: 1}
        });
        if (!user || !user.profile) {
            return;
        }
        return user.profile.fullName;
    },
    formatTime(timeToFormat) {
        return moment(timeToFormat).fromNow();
    },
    replyedMessages() {
        let replyedMessagesIds = this.replyedMessagesIds || [];
        return ActivityMessages.find({_id: {$in: replyedMessagesIds}}, {sort: {createdAt: -1}}).fetch();
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

Template.projectActivityMessage.events({
    'submit #reply-message-form': _.debounce(function (event, tmpl) {
        event.preventDefault();
        event.stopPropagation();

        let messageId = this._id;
        let projectId = tmpl.data && tmpl.data.projectId;
        let formClassName = event.target.className;
        let replyMessage = tmpl.$('#'+formClassName).val();
        if (!replyMessage) {
            return;
        }else {
            addActivityReplyMessage.call({message: replyMessage, messageId: messageId, projectId: projectId}, function (error, result) {
                if (error) {
                    VZ.notify(error.reason);
                }
                else {
                    tmpl.$('#'+formClassName).val('');
                }
            });
        }

    }, 300, true)
});