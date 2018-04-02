export const Skills = new Mongo.Collection('vj-job-skills');
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Skills.allow({
    insert: function (userId, doc) {
        return userId == 'wh8or4SeGKKr5WTDs';
    },
    update: function (userId, doc) {
        return userId == 'wh8or4SeGKKr5WTDs';
    }
});

export const SkillsSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    label: {
        type: String
    },
    link: {
        type: String,
        optional: true
    },
    type: {
        type: String,
        optional: true
    },
    language: {
        type: String,
        optional: true
    },
    isArchived: {
        type: Boolean,
        optional: true
    },
    createdAt: {
        type: Date,
        optional: true
    },
    createdBy: {
        type: String,
        optional: true
    },
    relatedJobCategoryId: {
        type: String,
        optional: true
    }
});