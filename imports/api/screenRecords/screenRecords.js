export const ScreenRecords = new Mongo.Collection('vz-screen-records');
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

ScreenRecords.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

ScreenRecords.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const ScreenRecordsSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    }
});