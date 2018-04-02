export const Positions = new Mongo.Collection('vz-positions');
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Positions.allow({
    insert: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    update: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    remove: (userId, doc) => false
});

Positions.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

const PositionsSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    name: {
        type: String
    },
    isArchived: {
        type: Boolean,
        defaultValue: false
    },
    createdAt: {
        type: Date,
        optional: true
    },
    createdBy: {
        type: String,
        optional: true
    }
});