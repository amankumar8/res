import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Conversations = new Mongo.Collection('vz-conversations');

Conversations.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

Conversations.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const ConversationSchema = new SimpleSchema({
    title: {
        type: String,
        optional: true
    },
    ownerId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    participantsIds: {
        type: [String]
    },
    isPrivate: {
        type: Boolean
    }
});

