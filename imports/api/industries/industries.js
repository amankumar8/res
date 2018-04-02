import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Industries = new Mongo.Collection('vz-industries');

Industries.allow({
    insert: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    update: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    remove: (userId, doc) => false
});

Industries.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

const IndustriesSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    name: {
        type: String
    },
    categories: {
        type: [String],
        optional: true
    },
    isArchived: {
        type: Boolean,
        optional: true
    },
    createdAt: {
        type: Date,
        denyUpdate: true,
        optional: true
    },
    createdBy: {
        type: String,
        optional: true
    }
});
