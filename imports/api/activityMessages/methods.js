import {Projects } from '/imports/api/projects/projects';
import { ActivityMessages, ActivityMessagesSchema } from '/imports/api/activityMessages/activityMessages';
import { VZ } from '/imports/startup/both/namespace';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const addActivityMessage = new ValidatedMethod({
    name: 'addActivityMessages.addActivityMessage',
  validate: null,

  // validate: new SimpleSchema({
    //     projectId: {
    //         type: String,
    //         regEx: SimpleSchema.RegEx.Id
    //     }
    // }).validator(),
    run({message, projectId}) {
        if (VZ.canUser('addActivityMessage', this.userId, projectId)) {
            message = _.extend(message, {
                type: 'project-activity-message',
                userId: this.userId,
                replyedMessagesIds: [],
                createdAt: new Date()
            });
            const id = ActivityMessages.insert(message);
            Projects.update({_id: projectId}, {$addToSet:{activityMessagesIds: id}});
        } else {
            throw new Meteor.Error('permission-error', 'You can\'t add messages!');
        }
    }
});

export const addActivityReplyMessage = new ValidatedMethod({
    name: 'addActivityMessages.addActivityReplyMessage',
  validate: null,
    // validate: new SimpleSchema({
    //     messageId: {
    //         type: String,
    //         regEx: SimpleSchema.RegEx.Id
    //     },
    //     projectId: {
    //         type: String,
    //         regEx: SimpleSchema.RegEx.Id
    //     }
    // }).validator(),
    run({message, messageId, projectId}) {
        const userId = this.userId;
        if (VZ.canUser('addActivityMessage', userId, projectId)) {
            const replyMessage = {
                message: message,
                type: 'reply-message',
                userId: this.userId,
                createdAt: new Date()
            };
            const id = ActivityMessages.insert(replyMessage);
            ActivityMessages.update({_id: messageId}, {$addToSet:{replyedMessagesIds: id}});
        } else {
            throw new Meteor.Error('permission-error', 'You can\'t add messages!');
        }
    }
});

export const addUserChangesMessage = new ValidatedMethod({
    name: 'addActivityMessages.addUserChangesMessage',
    validate: new SimpleSchema({
        status: {type: String},
        users:   {type: String},
        projectOwner: {type: String},
        projectId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({status, users, projectOwner, projectId}) {
        const userChangesMessage = {
            message: status,
            type: 'user-changes-message',
            userId: this.userId,
            projectOwner: projectOwner,
            createdAt: new Date()
        };
        if(status == 'users-added'){
            userChangesMessage.changedUsersIds = users.addedUsers
        }
        else if(status == 'users-removed'){
            userChangesMessage.changedUsersIds = users.removedUsers
        }

        const id = ActivityMessages.insert(userChangesMessage);
        Projects.update({_id: projectId}, {$addToSet:{activityMessagesIds: id}});
    }
});

export const addProjectCreatedMessage = new ValidatedMethod({
    name: 'addActivityMessages.addProjectCreatedMessage',
    validate: new SimpleSchema({
        status: {type: String},
        projectOwner: {type: String},
        projectId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            optional: true,
        }
    }).validator(),
    run({status, projectOwner, projectId, userId}) {
        userId = userId || this.userId;
        const userChangesMessage = {
            message: status,
            type: 'project-created-message',
            userId: userId,
            projectId: projectId,
            projectOwner: projectOwner,
            createdAt: new Date()
        };

        const id = ActivityMessages.insert(userChangesMessage);
        Projects.update({_id: projectId}, {$addToSet:{activityMessagesIds: id}});
    }
});
