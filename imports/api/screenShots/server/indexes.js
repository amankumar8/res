/**
 * Created by andriimakar on 8/31/17.
 */
import { Meteor } from 'meteor/meteor';
import { Screenshots } from '../screenShots';

Meteor.startup(function () {
        Screenshots.rawCollection().createIndex({timeEntryId: 1});
        Screenshots.rawCollection().createIndex({takenAt: 1});
});