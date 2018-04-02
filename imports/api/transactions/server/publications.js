import { Transactions } from '../transactions';
import { BankCredentials } from '/imports/api/bankCredentials/bankCredentials';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

publishComposite('allTransactionsWithUsersForAdmin', function (userId) {
    if(userId === 'wh8or4SeGKKr5WTDs' || this.userId) {
        return {
            find: function () {
                return Transactions.find();
            },
            children: [
                {
                    find: function (transaction) {
                        return BankCredentials.find({_id: transaction.bankAccountId});
                    }
                }
            ]
        }
    }
    else {
        return this.ready();
    }
});

publishComposite('oneTransactionWithUsersForAdmin', function (id, userId) {
    new SimpleSchema({
        id: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({ id });

    if(userId === 'wh8or4SeGKKr5WTDs' || this.userId) {
        return {
            find: function () {
                return Transactions.find({_id: id});
            },
            children: [
                {
                    find: function (transaction) {
                        return BankCredentials.find({_id: transaction.bankAccountId});
                    }
                }
            ]
        }
    }
    else {
        return this.ready();
    }
});