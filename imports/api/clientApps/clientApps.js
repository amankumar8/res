import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const ClientApps = new Mongo.Collection('client-apps');

ClientApps.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

ClientApps.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

const ClientAppsSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true

    },
    lastUpdated: {
        type: Date,
        optional: false
    }
});
