import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const EntryTags = new Mongo.Collection('vz-entry-tags');

EntryTags.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

EntryTags.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const EntryTagsSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true

    },
    name: {
        type: String
    },
    userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    createdAt: {
        type: Date,
        denyUpdate: true,
        optional: true
    }
});
