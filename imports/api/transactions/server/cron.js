import { Transactions } from '../transactions';
import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import { BankCredentials } from '/imports/api/bankCredentials/bankCredentials';
import { Contracts } from '/imports/api/contracts/contracts';
import {SyncedCron} from 'meteor/percolate:synced-cron';

let getMonth = function () {
    let startOfMonth = moment().subtract(1, 'month').startOf('month').toDate();
    let endOfMonth = moment().subtract(1, 'month').endOf('month').toDate();
    let monthName = moment().subtract(1, 'month').format('MMMM');
    return {
        startOfMonth: startOfMonth,
        endOfMonth: endOfMonth,
        monthName: monthName
    }
};

let getMoneyForEntries = function (timeEntries, end) {
    let oneHour = 1000 * 60 * 60;
    let amount = 0;
    for (let i = 0; i < timeEntries.length; i++) {
        let entry = timeEntries[i];
        let timeEntryDuration = 0;
        if (entry.endDate) {
            timeEntryDuration = entry.endDate - entry.startDate;
        }
        else {
            timeEntryDuration = end - entry.startDate;
        }

        let earned = timeEntryDuration * entry.paymentRate / oneHour;
        amount += earned;
    }

    return {
        amount: amount.toFixed(2)
    }
};

let generateTransactions = function () {
    let lastMonth = getMonth();
    let start = lastMonth.startOfMonth;
    let end = lastMonth.endOfMonth;
    let monthName = lastMonth.monthName;
    let query = {status: 'active'};
    query.workerId = {$exists: true};

    let contracts = Contracts.find(query).fetch();
    for (let i = 0; i < contracts.length; i++) {
        let worker = Meteor.users.findOne({_id: contracts[i].workerId});
        let employer = Meteor.users.findOne({_id: contracts[i].employerId});

        let bankCredentials = BankCredentials.findOne({userId: contracts[i].workerId});

        let timeEntries = TimeEntries.find({
            contractId: contracts[i]._id,
            userId: contracts[i].workerId,
            startDate: {
                $gte: start,
                $lte: end
            }
        }).fetch();

        let money = getMoneyForEntries(timeEntries, end);
        let transaction = {
            workerId: worker._id,
            employerId: employer._id,
            paymentReference: monthName + ' salary',
            amountCurrency: 'USD',
            sourceCurrency: 'USD',
            amount: parseFloat(money.amount),
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        if (bankCredentials) {
            transaction.bankAccountId = bankCredentials._id;
        }
        Transactions.insert(transaction);
    }
};

Meteor.startup(function () {
    if (Meteor.isServer) {
        // generateTransactions();
    }
});
if (Meteor.isServer) {
    SyncedCron.add({
        name: 'Creating transactions for the last month',
        schedule: function (parser) {
            return parser.text('on the first day of the month at 00:00 am ');
            // return parser.text('every 1 mins');
        },
        job: function () {
            let lastMonth = getMonth();
            let start = lastMonth.startOfMonth;
            let end = lastMonth.endOfMonth;
            let monthName = lastMonth.monthName;
            let query = {status: 'active'};
            query.workerId = {$exists: true};

            let contracts = Contracts.find(query).fetch();
            for (let i = 0; i < contracts.length; i++) {
                let worker = Meteor.users.findOne({_id: contracts[i].workerId});
                let employer = Meteor.users.findOne({_id: contracts[i].employerId});

                let bankCredentials = BankCredentials.findOne({userId: contracts[i].workerId});

                let timeEntries = TimeEntries.find({
                    contractId: contracts[i]._id,
                    userId: contracts[i].workerId,
                    startDate: {
                        $gte: start,
                        $lte: end
                    }
                }).fetch();

                let money = getMoneyForEntries(timeEntries, end);
                let transaction = {
                    workerId: worker._id,
                    employerId: employer._id,
                    paymentReference: monthName + ' salary',
                    amountCurrency: 'USD',
                    sourceCurrency: 'USD',
                    amount: parseFloat(money.amount),
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                if (bankCredentials) {
                    transaction.bankAccountId = bankCredentials._id;
                }
                Transactions.insert(transaction);
            }
        }
    });
}