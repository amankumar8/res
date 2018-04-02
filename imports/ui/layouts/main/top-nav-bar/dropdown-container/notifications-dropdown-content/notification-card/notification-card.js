import { VZ } from '/imports/startup/both/namespace';
import './notification-card.html';
import { markNotifications } from '/imports/api/notifications/methods';

Template.notificationCard.helpers({
    creationDate() {
        return moment(this.createdAt).format('HH:mm DD MMM')
    }
});

Template.notificationCard.events({
    'click .mark-notification-icon': function (e, tmpl) {
        const id = [tmpl.data._id];
        markNotifications.call({notificationsArray: id}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.log(message);
                VZ.notify('Failed to mark notifications');
            } else {
                VZ.notify('Notification read');
            }
        });
    }
});