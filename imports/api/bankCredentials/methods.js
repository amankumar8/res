import { BankCredentials, BankCredentialSchema } from './bankCredentials';
import { Transactions } from '/imports/api/transactions/transactions';
import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const addBankAccount = new ValidatedMethod({
    name: 'bankCredentials.addBankAccount',
    validate: BankCredentialSchema.pick('name', 'receiverType', 'targetCurrency', 'addressFirstLine', 'addressPostCode', 'addressCity', 'addressState', 'addressCountryCode', 'abartn', 'accountNumber').validator(),
    run(bankData) {
        let userId = this.userId;
        if (userId) {
            let user = Meteor.users.findOne({_id: userId});
            let recipientEmail = user.emails[0].address;
            bankData = _.extend(bankData, {
                userId: userId,
                recipientEmail: recipientEmail,
                accountType: 'checking',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            let id = BankCredentials.insert(bankData);
            Transactions.update({workerId: userId}, {$set: {bankAccountId: id}});
            return id;
        }
    }
});

export const updateBankAccount = new ValidatedMethod({
    name: 'bankCredentials.updateBankAccount',
    validate: BankCredentialSchema.pick('_id', 'name', 'receiverType', 'targetCurrency', 'addressFirstLine', 'addressPostCode', 'addressCity', 'addressState', 'addressCountryCode', 'abartn', 'accountNumber').validator(),
    run(bankData) {
        let userId = this.userId;
        if (userId) {
            let bankDataId = bankData._id;
            bankData = _.omit(bankData, '_id');
            let bankAccount = BankCredentials.findOne({_id: bankDataId});
            if (bankAccount) {
                bankData.updatedAt = new Date();
                BankCredentials.update({_id: bankAccount._id}, {$set: bankData});
                Transactions.update({workerId: userId}, {$set: {bankAccountId: bankAccount._id}});
            }
            else {
                throw new Meteor.Error('Bank account not found');
            }
        }
    }
});
