/**
 * Created by andriimakar on 8/31/17.
 */
import { Meteor } from 'meteor/meteor';
import { Projects } from '../projects';

Meteor.startup(function () {
        Projects.rawCollection().createIndex({name: 1});
        Projects.rawCollection().createIndex({projectKey: 1});
        Projects.rawCollection().createIndex({ownerId: 1});
        Projects.rawCollection().createIndex({assignedUsersIds: 1});
        Projects.rawCollection().createIndex({createdAt: 1});
        Projects.rawCollection().createIndex({description: 1});
});