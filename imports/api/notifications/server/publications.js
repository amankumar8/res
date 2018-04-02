import { Notifications } from '../notifications';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Meteor.publish('unreadNotifications', function () {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    return Notifications.find({
        userId: userId,
        isReaded: false
    }, {sort: {createdAt: -1}, limit: 5});
});

Meteor.publish('notifications', function (limit) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        limit: {
            type: Number
        }
    }).validate({ limit });

    return Notifications.find({
        userId: userId
    }, {sort: {createdAt: -1}, limit: limit});
});