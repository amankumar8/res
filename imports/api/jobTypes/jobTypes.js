import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const JobTypes = new Mongo.Collection('vj-job-types');

JobTypes.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

JobTypes.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const JobTypesSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true

    },
    label: {
        type: String
    }
});