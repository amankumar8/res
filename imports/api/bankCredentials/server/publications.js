import { BankCredentials } from '../bankCredentials';

Meteor.publish('userBankCredentials', function () {
    const userId =  this.userId;
    if (!userId) {
        return this.ready();
    }
    return BankCredentials.find({
        userId: userId
    });
});

Meteor.publish('allBankCredentials', function (appUserId) {
    const userId = appUserId || this.userId;
    if (!userId) {
        return this.ready();
    }
    return BankCredentials.find();
});

Meteor.publish('oneBankCredential', function (id, appUserId) {
    const userId = appUserId || this.userId;
    if (!userId) {
        return this.ready();
    }
    return BankCredentials.find({_id: id});
});