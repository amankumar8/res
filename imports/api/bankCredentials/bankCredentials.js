import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const BankCredentials = new Mongo.Collection('vz-bank-credentials');

BankCredentials.allow({
    insert: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    update: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    remove: (userId, doc) => false
});

BankCredentials.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const BankCredentialSchema = new SimpleSchema({
    _id: {
      type: String,
        optional: true
    },
    name: {
        type: String
    },
    recipientEmail: {
        type: String
    },
    receiverType: {
        type: String
    },
    targetCurrency: {
        type: String
    },
    addressFirstLine: {
        type: String
    },
    addressPostCode: {
        type: String
    },
    addressCity: {
        type: String
    },
    addressState: {
        type: String
    },
    addressCountryCode: {
        type: String
    },
    abartn: {
        type: String
    },
    accountNumber: {
        type: String
    },
    accountType: {
        type: String
    },
    userId: {
        type: String
    },
    createdAt: {
        type: Date,
        optional: true
    },

    updatedAt: {
        type: Date,
        optional: true
    }
});
