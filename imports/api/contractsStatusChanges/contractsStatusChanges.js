import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const ContractsStatusChanges = new Mongo.Collection('vz-contracts-status-changes');

ContractsStatusChanges.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

ContractsStatusChanges.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

const ContractsStatusChangeSchema = new SimpleSchema({
    contractId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },

    status: {
        type: String,
        allowedValues: ["pending", "active", "paused", "ended", "declined"]
    },

    changedAt: {
        type: Date
    },

    changedByUserId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    }
});
