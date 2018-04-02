import {Conversations } from './conversations';
import { Messages } from '/imports/api/messages/messages';
import { VZ } from '/imports/startup/both/namespace';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import {ValidatedMethod} from 'meteor/mdg:validated-method';

export const createConversation = new ValidatedMethod({
    name: 'conversations.createConversation',
    validate: new SimpleSchema({
        title: {type: String},
        participantsIds: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({title, participantsIds}) {
        participantsIds = participantsIds || [];

        let conversation = {
            ownerId: Meteor.userId(),
            participantsIds: participantsIds,
            isPrivate: false
        };

        if (title) {
            conversation.title = title;
        }

        let conversationId = Conversations.insert(conversation);

        Roles.addUsersToRoles(conversation.ownerId, ['conversation-owner', 'conversation-member'],
            conversationId);

        Roles.addUsersToRoles(conversation.participantsIds, 'conversation-member',
            conversationId);

        return conversationId;
    }
});

export const createPrivateConversation = new ValidatedMethod({
    name: 'conversations.createPrivateConversation',
    validate: new SimpleSchema({
        participantId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({participantId}) {
        let conversation = {
            participantsIds: [participantId, Meteor.userId()],
            isPrivate: true
        };

        let conversationId = Conversations.insert(conversation);
        Roles.addUsersToRoles(conversation.participantsIds, 'conversation-member',
            conversationId);

        return conversationId;
    }
});

export const addParticipantsToConversation = new ValidatedMethod({
    name: 'conversations.addParticipantsToConversation',
    validate: new SimpleSchema({
        conversationId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        participantsIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({conversationId, participantsIds}) {
        if (VZ.canUser('addParticipantToConversation', this.userId, conversationId)) {
            participantsIds = _.isArray(participantsIds) ? participantsIds : [participantsIds];

            Conversations.update({_id: conversationId}, {$addToSet: {participantsIds: {$each: participantsIds}}});
            Roles.addUsersToRoles(participantsIds, 'conversation-member', conversationId);
        } else {
            throw  new Meteor.Error('You\'re not a conversation owner!');
        }
    }
});

export const removeParticipantsFromConversation = new ValidatedMethod({
    name: 'conversations.removeParticipantsFromConversation',
    validate: new SimpleSchema({
        conversationId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        participantsIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({conversationId, participantsIds}) {
        if (VZ.canUser('addParticipantToConversation', this.userId, conversationId)) {
            participantsIds = _.isArray(participantsIds) ? participantsIds : [participantsIds];

            Conversations.update({_id: conversationId}, {
                $pullAll: {participantsIds: participantsIds}
            });
            Roles.removeUsersFromRoles(participantsIds, 'conversation-member', conversationId);
        } else {
            throw  new Meteor.Error('You\'re not a conversation owner!');
        }
    }
});

export const changeConversationTitle = new ValidatedMethod({
    name: 'conversations.changeConversationTitle',
    validate: new SimpleSchema({
        conversationId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        title: {type: String}
    }).validator(),
    run({conversationId, title}) {
        let userId = this.userId;
        if (VZ.canUser('editConversation', userId, conversationId)) {
            Conversations.update({_id: conversationId}, {
                $set: {title: title}
            });
        } else {
            throw  new Meteor.Error('You\'re not a conversation owner!');
        }
    }
});

export const openConversationWindow = new ValidatedMethod({
    name: 'conversations.openConversationWindow',
    validate: new SimpleSchema({
        conversationId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({conversationId}) {
        let userId = this.userId;
        if (VZ.canUser('viewConversation', userId, conversationId)) {
            let user = Meteor.user();

            user.activeConversationWindowsIds ?
                Meteor.users.update(user._id,
                    {$addToSet: {activeConversationWindowsIds: conversationId}}) :
                Meteor.users.update(user._id, {$set: {activeConversationWindowsIds: [conversationId]}});
        } else {
            throw  new Meteor.Error('You\'re not a conversation member!');
        }
    }
});

export const closeConversationWindow = new ValidatedMethod({
    name: 'conversations.closeConversationWindow',
    validate: new SimpleSchema({
        conversationId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({conversationId}) {
        let userId = this.userId;
        if (VZ.canUser('viewConversation', userId, conversationId)) {
            Meteor.users.update(this.userId,
                {$pull: {activeConversationWindowsIds: conversationId}})
        } else {
            throw  new Meteor.Error('You\'re not a conversation member!');
        }
    }
});

export const sendMessage = new ValidatedMethod({
    name: 'conversations.sendMessage',
    validate: new SimpleSchema({
        conversationId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        messageText: {type: String}
    }).validator(),
    run({conversationId, messageText}) {
        let userId = this.userId;
        if (VZ.canUser('viewConversation', userId, conversationId)) {
            let message = {
                text: messageText,
                conversationId: conversationId,
                senderId: Meteor.userId(),
                readBy: [{participantId: Meteor.userId(), readAt: new Date()}],
                sentAt: new Date()
            };
            return Messages.insert(message);

        } else {
            throw  new Meteor.Error('You\'re not a conversation member!');
        }
    }
});

export const readMessage = new ValidatedMethod({
    name: 'conversations.readMessage',
    validate: new SimpleSchema({
        messageId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({messageId}) {

        let message = Messages.findOne({
            _id: messageId,
            'readBy.participantId': {$ne: Meteor.userId()}
        });
        if (!message) {
            throw  new Meteor.Error('Message is not found or already read!');
        }

        let conversationId = message.conversationId;

        if (VZ.canUser('viewConversation', this.userId, conversationId)) {
            Messages.update({_id: messageId}, {
                $push: {
                    readBy: {
                        participantId: Meteor.userId(),
                        readAt: new Date()
                    }
                }
            });
        } else {
            throw  new Meteor.Error('You\'re not a conversation member!');
        }

        return messageId;
    }
});

export const readAllMessages = new ValidatedMethod({
    name: 'conversations.readAllMessages',
    validate: new SimpleSchema({
        conversationId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({conversationId}) {
        if (VZ.canUser('viewConversation', this.userId, conversationId)) {
            let unreadMessages = Messages.find({
                conversationId: conversationId,
                'readBy.participantId': {$ne: Meteor.userId()}
            }).fetch();
            let unreadMessagesIds = _.map(unreadMessages, function (message) {
                return message._id;
            });
            Messages.update({_id: {$in: unreadMessagesIds}}, {
                $push: {
                    readBy: {
                        participantId: Meteor.userId(),
                        readAt: new Date()
                    }
                }
            }, {multi: true});
        } else {
            throw  new Meteor.Error('You\'re not a conversation member!');
        }
    }
});

export const deleteMessage = new ValidatedMethod({
    name: 'conversations.deleteMessage',
    validate: new SimpleSchema({
        messageId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({messageId}) {
        let message = Messages.findOne({
            _id: messageId,
            'deletedBy.participantId': {$ne: Meteor.userId()}
        });
        if (!message) {
            throw  new Meteor.Error('Message is not found or already deleted!');
        }

        let conversationId = message.conversationId;
        let userId = this.userId;
        if (VZ.canUser('viewConversation', userId, conversationId)) {
            Messages.update({_id: messageId}, {
                $push: {
                    deletedBy: {
                        participantId: Meteor.userId(),
                        deletedAt: new Date()
                    }
                }
            });
        } else {
            throw  new Meteor.Error('You\'re not a conversation member!');
        }
    }
});

export const getMessagesQuery = new ValidatedMethod({
    name: 'conversations.getMessagesQuery',
    validate: new SimpleSchema({
        conversationId: { //dataconversationId
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        messageIdOrPageNumber: {type: String}, //messageIdOrPageNumber
        computeFromId: { //datamessageToScrollId
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({conversationId, messageIdOrPageNumber, computeFromId}) {
        if (!VZ.canUser('viewConversation', this.userId, conversationId)) {
            throw  new Meteor.Error('You\'re not a conversation member!');
        }

        if (computeFromId) {
            let targetMessage = Messages.findOne(messageIdOrPageNumber);
            if (targetMessage) {
                let allMessages = Messages.find({conversationId: conversationId},
                    {sort: {sentAt: -1}}).fetch();
                let allMessagesIds = _.map(allMessages, function (mess) {
                    return mess._id;
                });

                let targetMessagePos = _.indexOf(allMessagesIds, targetMessage._id);
                let messageBeforePos = targetMessagePos + 29 < allMessagesIds.length - 1
                    ? targetMessagePos + 29 : allMessagesIds.length - 1;
                let messageAfterPos = targetMessagePos - 30 > 0 ? targetMessagePos - 30 : 0;

                let firstMessage = allMessages[messageBeforePos];
                let lastMessage = allMessages[messageAfterPos];

                return {
                    query: {
                        sentAt: {
                            $gte: firstMessage.sentAt,
                            $lte: lastMessage.sentAt
                        }
                    },
                    isDno: targetMessagePos + 29 > allMessagesIds.length,
                    pageNumber: Math.floor(targetMessagePos / 30)
                };
            } else {
                return false;
            }
        } else {
            let DEF_LIMIT = 60;

            let pageNumber = messageIdOrPageNumber;
            let allMessagesCount = Messages.find({conversationId: conversationId}).count();

            if (allMessagesCount <= 0) {
                return false;
            }

            let skip = pageNumber * 30;
            let isDno = allMessagesCount <= DEF_LIMIT || skip > allMessagesCount - DEF_LIMIT;

            if (allMessagesCount <= DEF_LIMIT) {
                isDno = true;
                skip = 0;
            } else if (skip > allMessagesCount - DEF_LIMIT) {
                isDno = true;
                skip = allMessagesCount - DEF_LIMIT;
            }

            let messagesForCurrentPage = Messages.find({conversationId: conversationId}, {
                sort: {sentAt: -1},
                limit: DEF_LIMIT,
                skip: skip
            }).fetch();

            let firstMessage = messagesForCurrentPage[0];
            let lastMessage = messagesForCurrentPage[messagesForCurrentPage.length - 1];

            let query = {
                sentAt: {
                    $gte: lastMessage.sentAt
                }
            };
            if (pageNumber > 0) {
                query.sentAt.$lte = firstMessage.sentAt
            }
            return {
                query: query,
                isDno: isDno
            };
        }
    }
});