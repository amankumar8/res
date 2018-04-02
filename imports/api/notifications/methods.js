import { Notifications, NotificationsSchema} from './notifications';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const sendNotifications = new ValidatedMethod({
    name: 'notifications.sendNotifications',
    validate(args) {
        args.usersIdsArray = _.isArray(args.usersIdsArray) ? args.usersIdsArray : [args.usersIdsArray];
        check(args, {
            title: String,
            msg: String,
            usersIdsArray: [String],
            userId: Match.Maybe(String),
        });
    },
    run({title, msg, usersIdsArray, userId}) {
        userId = userId || this.userId;
        if (!userId) {
            throw new Meteor.Error('notifications.sendNotifications.notLoggedIn',
                'Must be logged in to create notification.');
        }

        if(usersIdsArray.length > 0){
            let notificationObj = {
                title: title,
                message: msg,
                createdAt: moment().toDate(),
                isReaded: false,
                createdBy: this.userId
            };

            _.each(usersIdsArray, function (userId) {
                let obj = {
                    userId: userId
                };
                _.extend(obj, notificationObj);

                Notifications.insert(obj);
            });
        }
    }
});

export const unreadNotificationsCount = new ValidatedMethod({
    name: 'notifications.unreadNotificationsCount',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('notifications.unreadNotificationsCount.notLoggedIn',
                'Must be logged in.');
        }
        return Notifications.find({
            userId: userId,
            isReaded: false
        }).count();
    }
});

export const notificationsCount = new ValidatedMethod({
    name: 'notifications.notificationsCount',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('notifications.notificationsCount.notLoggedIn',
                'Must be logged in.');
        }
        return Notifications.find({
            userId: userId
        }).count();
    }
});

export const markNotifications = new ValidatedMethod({
    name: 'notifications.markNotifications',
    validate: new SimpleSchema({
        notificationsArray: {type: [String]}
    }).validator(),
    run({notificationsArray}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('notifications.markNotifications.notLoggedIn',
                'Must be logged in.');
        }
        Notifications.update({_id:{$in: notificationsArray}, userId: userId}, {$set:{isReaded: true}}, {multi: true});
    }
});

export const markAllNotifications = new ValidatedMethod({
  name: 'notifications.markAllNotifications',
  validate: null,
  run({}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('notifications.markNotifications.notLoggedIn',
        'Must be logged in.');
    }
    Notifications.update({userId: userId}, {$set:{isReaded: true}}, {multi: true});
  }
});