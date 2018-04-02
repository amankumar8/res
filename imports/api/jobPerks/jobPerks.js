import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const JobPerks = new Mongo.Collection('vj-job-perks');

JobPerks.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

JobPerks.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const JobPerksSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true

    },
    label: {
        type: String
    }
});