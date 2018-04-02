/**
 * Created by andriimakar on 9/11/17.
 */
import { VZ } from '/imports/startup/both/namespace';
import { Screenshots } from '/imports/api/screenShots/screenShots';
import './time-entry.html';

Template.projectTimeEntry.onCreated(function () {
    this.isEditing = new ReactiveVar(false);
});

Template.projectTimeEntry.onRendered(function () {

});

Template.projectTimeEntry.helpers({
    taskNameKey() {
        // console.log(this)
        let message = this.message;
        let index = message.indexOf(':');
        if(index != -1){
            return {
                name:  message.split(':')[1],
                key: message.split(':')[0]
            }
        }
        else {
            return {
                name: message,
                key: '-'
            }
        }
    },
    totalEarned() {
        let startDate = this.startDate;
        let endDate = this.endDate;
        let oneHour = 1000 * 60 * 60;
        if(this.paymentType && this.paymentType === 'hourly') {
            let rate = this.paymentRate;
            let duration = endDate - startDate;
            let totalEarned = duration * rate / oneHour;
            totalEarned = totalEarned.toFixed(2);
            return '$' + totalEarned + ' earned';
        } else if (this.paymentType && this.paymentType === 'monthly') {
            const duration = endDate - startDate;
            const workingTimeThisMonth = this.workingDaysThisMonth * 8 * oneHour;
            const earned = (this.paymentRate / workingTimeThisMonth) * duration;
            return `\$${earned.toFixed(2)} earned`;
        } else {
            return 0;
        }
    },
    entryTimeTracked() {
        let startDate = this.startDate;
        let endDate = this.endDate;

        return moment(endDate).diff(startDate, 'second');
    },
    screenShotsCount() {
        let timeEntryId = this._id;
        return Screenshots.find({timeEntryId: timeEntryId}).count();
    },
    isEditing(){
        return Template.instance().isEditing.get();
    },
    onEditChangeCb() {
        let tmpl = Template.instance();
        return function () {
            tmpl.isEditing.set(false);
        }
    }
});

Template.projectTimeEntry.events({
    'click #edit-time-entry': function (event, tmpl) {
        event.preventDefault();
        event.stopPropagation();
        tmpl.isEditing.set(true);
    }
});