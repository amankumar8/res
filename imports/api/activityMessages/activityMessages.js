import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const ActivityMessages = new Mongo.Collection('vz-activity-messages');

ActivityMessages.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

ActivityMessages.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const ActivityMessagesSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    message: {
        type: String
    },
    type: {
        type: String,
        optional: true
    },
    userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    projectId: {
        type: String
    },
    projectOwner: {
        type: String,
        optional: true
    },
    createdAt: {
        type: Date,
        denyUpdate: true,
        optional: true
    },
    changedUsersIds: {
        type: [String],
        optional: true
    }
});
