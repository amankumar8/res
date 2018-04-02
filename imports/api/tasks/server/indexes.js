/**
 * Created by andriimakar on 8/31/17.
 */
import { Meteor } from 'meteor/meteor';
import { Tasks } from '../tasks';

Meteor.startup(function () {
        Tasks.rawCollection().createIndex({projectId: 1});
        Tasks.rawCollection().createIndex({membersIds: 1});
        Tasks.rawCollection().createIndex({ownerId: 1});
        Tasks.rawCollection().createIndex({taskKey: 1});
        Tasks.rawCollection().createIndex({createdAt: 1});
});