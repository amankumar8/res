export const Transactions = new Mongo.Collection('vz-transactions');
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Transactions.allow({
    insert: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    update: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    remove: (userId, doc) => false
});

Transactions.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

const TransactionSchema = new SimpleSchema({
    workerId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    employerId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    paymentReference: {
        type: String
    },
    amountCurrency: {
        type: String
    },
    sourceCurrency: {
        type: String
    },
    amount: {
        type: Number,
        decimal: true
    },
    status: {
        type: String
    },
    createdAt: {
        type: Date,
        optional: true
    },
    updatedAt: {
        type: Date,
        optional: true
    },
    bankAccountId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    }
});
