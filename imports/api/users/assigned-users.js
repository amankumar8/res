import { VZ } from '/imports/startup/both/namespace';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

VZ.UserRoles = {};

Meteor.users.allow({
    insert: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    update: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    remove: (userId, doc) => false
});

Meteor.users.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export let Schemas = {};

const coordinatesSchema = new SimpleSchema({
    lat: {
        type: Number,
        decimal: true
    },
    lng: {
        type: Number,
        decimal: true
    }
});

export const locationSchema = new SimpleSchema({
    administrative_area_level_1: {
        type: String,
        optional: true
    },
    administrative_area_level_2: {
        type: String,
        optional: true
    },
    administrative_area_level_3: {
        type: String,
        optional: true
    },
    administrative_area_level_4: {
        type: String,
        optional: true
    },
    administrative_area_level_5: {
        type: String,
        optional: true
    },
    country: {
        type: String
    },
    locality: {
        type: String
    },
    coordinates: {
        type: coordinatesSchema
    },
    postal_code: {
        type: String,
        optional: true
    }
});
export const updateProfileSchema = new SimpleSchema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    availabilityTime: {
        type: String
    },
    getInvitations: {
        type: Boolean
    },
    hourlyRate: {
        type: Number
    },
    location: {
        type: locationSchema
    },
    overview: {
        type: String
    },
    skills: {
        type: [String]
    }
});
const socialMediasSchema = new SimpleSchema({
    socialMediaLink: {
        type: String
    },
    socialMediaName: {
        type: String
    }
});

export const updateProfileMediaSchema = new SimpleSchema({
    languages: {
        type: [String]
    },
    personalWebsite: {
        type: String
    },
    socialMedias: {
        type: [socialMediasSchema]
    }
});

Schemas.profilePhoto = new SimpleSchema({
    large: {
        type: String,
        defaultValue: '/images/default-lockout.png'
    },
    small: {
        type: String,
        defaultValue: '/images/default-lockout.png'
    }
});

Schemas.UserProfile = new SimpleSchema({
    availability: {
        type: Boolean,
        optional: true
    },
    photo: {
        type: Schemas.profilePhoto,
        optional: true
    },

    firstName: {
        type: String,
        optional: true
    },

    lastName: {
        type: String,
        optional: true
    },

    fullName: {
        type: String,
        optional: true
    },

    description: {
        type: String,
        optional: true
    },

    gender: {
        type: String,
        allowedValues: ['', 'male', 'female'],
        optional: true
    },

    location: {
        type: Object,
        optional: true
    },

    skills: {
        type: [String],
        optional: true
    },

    education: {
        type: String,
        optional: true
    },

    projectsDone: {
        type: Number,
        min: 0,
        optional: true
    },

    hours: {
        type: Number,
        min: 0,
        optional: true
    },

    earned: {
        type: Number,
        min: 0,
        optional: true
    },

    activeProjects: {
        type: Number,
        min: 0,
        optional: true
    },
    teamName: {
        type: String,
        optional: true
    },
    lastWorkedEntryId: {
        type: String,
        optional: true
    },
    isArchived: {
        type: Boolean,
        optional: true
    },
    isBlocked: {
        type: Boolean,
        optional: true
    },
    blockedBy: {
        type: String,
        optional: true
    },
    blockedAt: {
        type: Date,
        optional: true
    },
    blockedWhy: {
        type: String,
        optional: true
    },
    archivedBy: {
        type: String,
        optional: true
    },
    archivedAt: {
        type: Date,
        optional: true
    }
});


Schemas.User = new SimpleSchema({

    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },

    emails: {
        type: [Object],
        optional: false
    },

    'emails.$.address': {
        type: String,
        regEx: SimpleSchema.RegEx.Email
    },

    'emails.$.verified': {
        type: Boolean
    },

    createdAt: {
        type: Date
    },

    profile: {
        type: Schemas.UserProfile,
        optional: true
    },

    services: {
        type: Object,
        optional: true,
        blackbox: true
    },

    status: {
        type: String,
        optional: true
    },

    roles: {
        type: [String],
        optional: true
    }
});
