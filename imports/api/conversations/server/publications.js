import { Conversations } from '../conversations';
import { Messages } from '/imports/api/messages/messages';
import { VZ } from '/imports/startup/both/namespace';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

publishComposite('conversation', function (conversationId) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        conversationId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({conversationId});

    return {
        find: function () {
            if (VZ.canUser('viewConversation', userId, conversationId)) {
                return Conversations.find({_id: conversationId});
            } else {
                this.ready();
            }
        },
        children: [{
            find: function (conversation) {
                return Meteor.users.find({_id: {$in: conversation.participantsIds}});
            }
        }]
    }
});

publishComposite('allConversations', function () {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }

    return {
        find: function () {
            let params = {
                $or: [{
                    ownerId: userId
                }, {
                    participantsIds: userId
                }]
            };
            return Conversations.find(params);
        },
        children: [{
            find: function (conversation) {
                let usersIds = _.union(conversation.participantsIds, conversation.ownerId);
                return Meteor.users.find({_id: {$in: usersIds}},
                    {
                        fields: {
                            profile: 1
                        }
                    });
            }
        }, {
            find: function (conversation) {
                return Messages.find({conversationId: conversation._id},
                    {limit: 1, sort: {sentAt: -1}})
            }
        }]
    }
});

Meteor.publish('messages', function (params = {}) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }

    let conversationId = params.conversationId;
    if (VZ.canUser('viewConversation', userId, conversationId)) {
        _.extend(params, {
            'deletedBy.participantId': {$ne: userId}
        });

        return Messages.find(params);

    } else {
        this.ready();
    }
});

Meteor.publish('singleMessage', function (messageId) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        messageId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({ messageId });

    let message = Messages.findOne(messageId);

    if (message && VZ.canUser('viewConversation', userId, message.conversationId)) {
        return Messages.find(messageId);
    } else {
        this.ready();
    }
});

Meteor.publish('unreadMessages', function (conversationId) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        conversationId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({ conversationId });

    let options = {limit: 10};

    if (conversationId) {
        if (VZ.canUser('viewConversation', userId, conversationId)) {
            return Messages.find({
                conversationId: conversationId,
                'readBy.participantId': {$ne: userId},
                'deletedBy.participantId': {$ne: userId}
            }, options);
        } else {
            this.ready();
        }
    } else {
        let conversationsIds = [];
        Conversations.find({
            $or: [{
                ownerId: userId
            }, {
                participantsIds: userId
            }]
        }).forEach(function (conversation) {
            conversationsIds.push(conversation._id);
        });

        return Messages.find({
            conversationId: {$in: conversationsIds},
            'readBy.participantId': {$ne: userId},
            'deletedBy.participantId': {$ne: userId}
        }, options);
    }
});

Meteor.publish('activeConversationWindowsIds', function () {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    return Meteor.users.find({_id: userId}, {fields: {activeConversationWindowsIds: 1}});
});