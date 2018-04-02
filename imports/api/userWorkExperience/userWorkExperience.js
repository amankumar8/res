import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const UserWorkExperience = new Mongo.Collection('vz-user-work-experience');

UserWorkExperience.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

UserWorkExperience.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const WorkExperienceSchema = new SimpleSchema({
    title: {
        type: String,
        min: 3,
        max: 70
    },
    company: {
        type: String,
        min: 3,
        max: 70
    },
    description: {
        type: String,
        min: 3,
        max: 300
    },
    isWorking: {
        type: Boolean,
        defaultValue: false
    },
    startAt: {
        type: Date,
        optional: true
    },
    completeAt: {
        type: Date,
        optional: true
    }
});

WorkExperienceSchema.messages({

    "minString title": "[label] must be at least [min] characters",
    "maxString title": "[label] cannot exceed [max] characters",

    "required title": "Job title is required",

    "minString company": "[label] must be at least [min] characters",
    "maxString company": "[label] cannot exceed [max] characters",

    "required company": "Company is required",

    "minString description": "[label] must be at least [min] characters",
    "maxString description": "[label] cannot exceed [max] characters",

    "required description": "Decription is required",

    "required startAt": "Date creation required",
    "required completeAt": "Date complete required"
});
