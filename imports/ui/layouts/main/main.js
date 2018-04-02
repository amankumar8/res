import {TimeEntries} from '/imports/api/timeEntries/timeEntries';
import {VZ} from '/imports/startup/both/namespace';
import './conversations-manager/conversations-manager';
import './left-menu/left-menu';
import './top-nav-bar/top-nav-bar';
import './main.html';

Template.mainLayout.onCreated(function () {
  this.autorun(() => {
    this.subscribe('activeTimeEntryTab');
  });
});
Template.mainLayout.onRendered(function () {
});

Template.mainLayout.helpers({
  user() {
    return !!Meteor.user();
  },
  setTitle() {
    let user = Meteor.users.findOne({_id: Meteor.userId()});
    let entryId = user && user.profile && user.profile.entryId;
    if (entryId) {
      if (VZ.TimeTracker.instance.isRunning.get()) {
        let timeEntry = TimeEntries.findOne({_id: entryId});
        let timeEntryMessage = timeEntry && timeEntry.message && timeEntry.message.split(':');
        timeEntryMessage = timeEntryMessage[0];
        let secondsElapsed = VZ.TimeTracker.instance.timeElapsed.get(),
          millisec = secondsElapsed * 1000;
        let hours = parseInt(moment.duration(millisec).asHours());
        if (hours < 10) {
          hours = '0' + hours;
        }
        let timeElapsed = hours + moment.utc(millisec).format(':mm:ss');
        let title = timeEntryMessage + ' - ' + timeElapsed;
        document.title = title;
      }
    }
    else {
      document.title = 'Vezio';
    }
  }
});
