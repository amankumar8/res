/**
 * Created by andriimakar on 8/31/17.
 */
import { Meteor } from 'meteor/meteor';
import { Contracts } from '../contracts';

Meteor.startup(function () {
    Contracts.rawCollection().createIndex({workerId: 1});
    Contracts.rawCollection().createIndex({companyId: 1});
    Contracts.rawCollection().createIndex({projectIds: 1});
    Contracts.rawCollection().createIndex({employerId: 1});
});