import { Meteor } from 'meteor/meteor';
import { TimeEntries } from '../timeEntries';

Meteor.startup(function () {
        TimeEntries.rawCollection().createIndex({projectId: 1});
        TimeEntries.rawCollection().createIndex({taskId: 1});
        TimeEntries.rawCollection().createIndex({contractId: 1});
        TimeEntries.rawCollection().createIndex({userId: 1});
        TimeEntries.rawCollection().createIndex({startDate: 1});
});