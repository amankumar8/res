import { VZ } from '/imports/startup/both/namespace';
import { Notifications } from '/imports/api/notifications/notifications';
import './notificationItem/notificationItem.html';
import './notifications.html';
import { notificationsCount, markNotifications } from '/imports/api/notifications/methods';

Template.notifications.onCreated(function () {
    this.markedNotifications = new ReactiveArray([]);
    this.notificationLimit = new ReactiveVar(10);
    this.clientDocsCount = new ReactiveVar();
    this.serverDocsCount = new ReactiveVar();
    
    this.autorun(() => {
        let limit = this.notificationLimit.get();
        this.subscribe('notifications', limit);
    });
    
    this.autorun(() => {
        this.clientDocsCount.set(Notifications.find().count());
        notificationsCount.call({}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                VZ.notify(message);
            } else {
                this.serverDocsCount.set(res);
            }
        });
    });
});

Template.notifications.helpers({
    notifications() {
        let notifications = Notifications.find({},{sort:{createdAt: -1}}).fetch();
        return notifications;
    },
    
    loadMore() {
        let tmpl = Template.instance();
        let clientDocsCount = tmpl.clientDocsCount.get();
        let serverDocsCount = tmpl.serverDocsCount.get();
        return serverDocsCount > clientDocsCount;
    },
    
    showMarkButton() {
        return Template.instance().markedNotifications.list().length > 0
    }
});

Template.notifications.events({
    'click .load-more-btn': function (e, tmpl) {
        let oldCount = tmpl.notificationLimit.get();
        tmpl.notificationLimit.set(oldCount + 10);
    },
    
    'change .mark-notification': function (e, tmpl) {
        let id = $(e.currentTarget).prop('id');
        if($(e.currentTarget).prop('checked')){
            tmpl.markedNotifications.push(id);
        } else {
            tmpl.markedNotifications.remove(id);
        }
    },
    
    'click .mark-as-read-btn': function (e, tmpl) {
        let ids = tmpl.markedNotifications.array();
        if(ids.length > 0){
            markNotifications.call({notificationsArray: ids}, (err, res) => {
                if (err) {
                    let message = err.reason || err.message;
                    console.log(message);
                    VZ.notify('Failed to mark notifications');
                } else {
                    tmpl.markedNotifications.clear();
                    VZ.notify('Notifications marked')
                }
            });
        }
    }
});