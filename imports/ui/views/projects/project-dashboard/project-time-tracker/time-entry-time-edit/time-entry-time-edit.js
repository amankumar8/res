/**
 * Created by andriimakar on 9/10/17.
 */

import './time-entry-time-edit.html';
import { VZ } from '/imports/startup/both/namespace';
import { editTimeEntry } from '/imports/api/timeEntries/methods';

Template.timeEntryEdit.onCreated(function () {
    this.startTime = new ReactiveVar(this.data.entry.startDate);
    this.endTime = new ReactiveVar(this.data.entry.endDate);
    this.autorun(() => {
        Template.currentData();
    });
});

Template.timeEntryEdit.onRendered(function () {
    let start = moment(this.startTime.get()).format('DD/MM/YYYY HH:mm:ss');
    let end = moment(this.endTime.get()).format('DD/MM/YYYY HH:mm:ss');
    this.$('#edit-start-time').val(start);
    this.$('#edit-end-time').val(end);
});

Template.timeEntryEdit.helpers({

});

Template.timeEntryEdit.events({
    'click #update-time-entry': function (event, tmpl) {
        event.preventDefault();
        event.stopPropagation();
        let changeObj = {};

        if (tmpl.startTime.get() && tmpl.endTime.get()) {
            changeObj.startDate = moment(tmpl.startTime.get()).toDate();
            changeObj.endDate = moment(tmpl.endTime.get()).toDate();
            changeObj._totalMinutes = moment(changeObj.endDate).diff(changeObj.startDate, 'minutes');
        }
        if (!_.isEmpty(changeObj)) {
            changeObj._id = tmpl.data.entry._id;
            changeObj.tags = [];
            editTimeEntry.call(changeObj, function (err, res) {
                if (err) {
                    console.log(err);
                    VZ.notify('Failed to update time entry');
                }
                else {
                    VZ.notify('Entry updated');
                    tmpl.data.onEditChangeCb();
                }
            });
        }
        else {
            tmpl.data.onEditChangeCb();
        }
    },

    'input .edit-time-input': function (event, tmpl) {
        let start = moment(tmpl.$('#edit-start-time').val(), 'DD/MM/YYYY HH:mm:ss');
        let end = moment(tmpl.$('#edit-end-time').val(), 'DD/MM/YYYY HH:mm:ss');

        if (start.isValid() && end.isValid()) {
            tmpl.startTime.set(start);
            tmpl.endTime.set(end);
        } else {
            tmpl.startTime.set();
            tmpl.endTime.set();
        }
    },
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};
