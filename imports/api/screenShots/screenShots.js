import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Screenshots = new Mongo.Collection('vz-time-entries-screenshots');

Screenshots.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

Screenshots.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

const screeshotsSchema = new SimpleSchema({
    timeEntryId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },

    uploadedAt: {
        type: Date
    },

    takenAt: {
        type: Date
    },

    screenshotThumbnailPreviewURL: {
        type: String,
        optional: true //Conversion takes place later
    },

    screenshotOriginalURL: {
        type: String,
        optional: true //Conversion takes place later
    },
    deleted: {
        type: Boolean,
        optional: true
    },
    keyEvents: {
        type: Number
    },
    mouseEvents: {
        type: Number
    }
});