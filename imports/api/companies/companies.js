import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { VZ } from '/imports/startup/both/namespace';

export const SocialMediaSchema = new SimpleSchema({
    socialMediaName: {
        type: String
    },
    socialMediaLink: {
        type: String,
        regEx: SimpleSchema.RegEx.Url
    }
});

export const Companies = new Mongo.Collection('vz-companies');

Companies.allow({
    insert: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    update: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    remove: (userId, doc) => false
});

Companies.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const Location = new SimpleSchema({
    country: {
        type: String
    },

    city: {
        type: String,
        optional: true
    },

    address: {
        type: String,
        optional: true
    },

    zip: {
        type: String,
        optional: true
    }
});

export const Phone = new SimpleSchema({
    countryCode: {
        type: String,
        optional: true
    },
    number: {
        type: String,
        optional: true
    }
});

export const Contacts = new SimpleSchema({
    phones: {
        type: [String],
        optional: true
    },
    emails: {
        type: [String],
        optional: true
    },
    website: {
        type: String,
        optional: true
    }
});

export const CompanySchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    name: {
        type: String,
        min: 2,
        max: 50
    },

    createdAt: {
        type: Date,
        optional: true
    },

    ownerId: {
        type: String,
        optional: true
    },

    isPrivate: {
        type: Boolean,
        optional: true
    },
    isArchived: {
        type: Boolean,
        optional: true
    },

    description: {
        type: String,
        optional: true
    },

    logoUrl: {
        type: String,
        optional: true
    },

    location: {
        type: Location,
        optional: true
    },

    vat: {
        type: String,
        optional: true
    },

    registrationNumber: {
        type: String,
        optional: true
    },

    workersIds: {
        type: [String],
        optional: true
    },

    assignedTeamsIds: {
        type: [String],
        optional: true
    },

    admins: {
        type: String,
        optional: true
    },

    contacts: {
        type: Contacts,
        optional: true
    },

    status: {
        type: String,
        optional: true
    },

    archivedAt: {
        type: Date,
        optional: true
    },

    verified: {
        type: String,
        optional: true
    },
    modifiedAt: {
        type: Date,
        optional: true
    },
    modifiedBy: {
        type: String,
        optional: true
    },
    isArchivedFromBackOffice: {
        type: Boolean,
        optional: true
    },
    employeesCount: {
        type: String,
        optional: true
    },
    contactsRelated: {
        type: [String],
        optional: true
    },
    jobsRelated: {
        type: [String],
        optional: true
    },
    createdBy: {
        type: String,
        optional: true

    },
    year: {
        type: String,
        optional: true
    },
    socialMedia: {
        type: [SocialMediaSchema],
        optional: true
    },
    logo: {
        type: Object,
        optional: true
    },
    'logo.type': {
        type: String,
        optional: true
    },
    'logo.buffer': {
      type: Uint8Array,
        optional: true
    },
    archivedApplicantsIds: {
        type: Array,
        optional: true
    },
    'archivedApplicantsIds.$': {
        type: String
    },
    shortlistedApplicantsIds: {
        type: Array,
        optional: true
    },
    'shortlistedApplicantsIds.$': {
        type: String
    },
    invitedUsers: {
        type: [String],
        optional: true
    },
    hiredUsers: {
        type: [String],
        optional: true
    },
    favoriteUsersIds: {
        type: [String],
        optional: true
    },
    addedToFavoriteUsersIds: {
        type: [String],
        optional: true
    }
});

