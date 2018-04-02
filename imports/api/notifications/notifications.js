import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Notifications = new Mongo.Collection('vz-notifications');

Notifications.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

Notifications.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});
export const NotificationsSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    title: {
        type: String
    },
    message: {
        type: String,
        optional: true
    },
    createdAt: {
        type: Date,
        optional: true
    },
    isReaded: {
        type: Boolean,
        defaultValue: false
    },
    createdBy: {
        type: String,
        optional: true
    }
});
