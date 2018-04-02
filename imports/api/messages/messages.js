export const Messages = new Mongo.Collection('vz-conversations-messages');
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Messages.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

Messages.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

const MessageSchema = new SimpleSchema({
    text: {
        type: String
    },
    conversationId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    senderId: {
        type: String
    },
    sentAt: {
        type: Date
    },

    readBy: {
        type: [Object],
        optional: true
    },
    'readBy.$.participantId': {
        type: String
    },
    'readBy.$.readAt': {
        type: Date
    },

    deletedBy: {
        type: [Object],
        optional: true
    },
    'deletedBy.$.participantId': {
        type: String
    },
    'deletedBy.$.deletedAt': {
        type: Date
    }
});
