import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Countries = new Mongo.Collection('vj-countries');

Countries.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

Countries.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

const CountrySchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    countryCode: {
        type: String
    },
    label: {
        type: String
    },
    continentCode: {
        type: String,
        optional: true
    }
});
