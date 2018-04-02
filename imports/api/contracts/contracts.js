import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Contracts = new Mongo.Collection('vz-contracts');

Contracts.allow({
    insert: (userId, doc) => true,
    update: (userId, doc) => true,
    remove: (userId, doc) => false
});

Contracts.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const ContractSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    name: {
        type: String
    },

    createdAt: {
        type: Date
    },

    employerId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },

    workerId: {
        type: String
    },

    status: {
        type: String,
        allowedValues: ["pending", "active", "paused", "ended", "declined"]
    },
    paymentInfo: {
        type: Object,
        optional: true
    },

    "paymentInfo.type": {
        type: String,
        allowedValues: ["hourly", "monthly", "fixed"]
    },

    "paymentInfo.rate": {
        type: Number,
        decimal: true,
        min: 0
    },

    "paymentInfo.weekHoursLimit": {
        type: Number,
        min: 0,
        max: 100
    },

    "paymentInfo.minimalCommitment": {
        type: Number
    },

    "paymentInfo.budgetLimitHours": {
        type: Number
    },

    companyId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    projectIds: {
        type: [String],
        regEx: SimpleSchema.RegEx.Id,
        min: 1
    },
    userRole: {
        type: String,
        optional: true
    },
    
    countryCode: {
      type: String,
      optional: true
    },

    workingDaysLastMonth: {
      type: Number,
      optional: true
    },

    workingDaysThisMonth: {
      type: Number,
      optional: true
    },

    workingTimeLeft: {
      type: Number,
      optional: true
    }
});
