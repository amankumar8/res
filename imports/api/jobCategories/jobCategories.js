export const JobCategories = new Mongo.Collection('vj-job-categories');
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

JobCategories.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

JobCategories.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

const JobCategoriesSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true

    },
    label: {
        type: String
    }
});
