import './edit-entry/time-tracker-edit-entry';
import './show-entry/time-tracker-show-entry';
import './time-tracker-time-entry.html';

Template.timeEntry.onCreated(function () {
    this.editEntry = new ReactiveVar(false);
    this.changeEditState = (state) => {
        this.editEntry.set(state);
    }
});

Template.timeEntry.helpers({
    editEntry() {
        return Template.instance().editEntry.get();
    },

    changeStateCb() {
        return Template.instance().changeEditState;
    },
    betweenHours() {
        let format = 'hh:mm A';
        return moment(this.startDate).format(format) + ' - ' + moment(this.endDate).format(format);
    },

    duration() {
        let duration = moment(this.endDate).diff(this.startDate), //milliseconds
            hours = parseInt(moment.duration(duration).asHours());
        if (hours < 10) {
            hours = '0' + hours;
        }
        return hours + moment.utc(duration).format(':mm:ss')
    }

});

Template.timeEntry.events({});

