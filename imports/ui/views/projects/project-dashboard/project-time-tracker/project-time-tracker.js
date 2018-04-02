import { VZ } from '/imports/startup/both/namespace';
import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import { Tasks } from '/imports/api/tasks/tasks';

import './project-time-entries/project-time-entries';
import './project-time-tracker.html';

Template.projectTimeTracker.onCreated(function () {
    this.searchString = new ReactiveVar('');
    this.autorun(() => {
        let data = Template.currentData();
        let projectId = data.project && data.project._id;
        let searchString = this.searchString.get();
        this.subscribe('filterTasks', searchString, projectId);
    });
});

Template.projectTimeTracker.onRendered(function () {
    this.autorun(() => {
        this.$('#time-entry-message').val('');
        if (VZ.TimeTracker.instance.isRunning.get()) {
            let data = Template.currentData();
            let projectId = data.project._id;
            let activeTimeEntry = TimeEntries.findOne({
                _isActive: true,
                projectId: projectId,
                userId: Meteor.userId()
            });
            if (activeTimeEntry && activeTimeEntry.projectId == projectId) {
                let timeEntryMessage = activeTimeEntry.message;
                this.$('#time-entry-message').val(timeEntryMessage);
                console.log('Found active entry. Setting value for input field: "' + timeEntryMessage + '"');
            }
        }
    });
});

Template.projectTimeTracker.helpers({
    canEditProject() {
        let projectId = this.project && this.project._id;
        return VZ.canUser('editProject', Meteor.userId(), projectId);
    },
    tasks() {
        let tmpl = Template.instance();
        let searchString = tmpl.searchString.get();
        let projectId = tmpl.data && tmpl.data.project && tmpl.data.project._id;
        let tasks = Tasks.find({
            taskKey: {
                $regex: searchString, $options: 'gi'
            },
            projectId: projectId,
            archived: false,
            membersIds: Meteor.userId()
        }).fetch();
        return tasks;
    },
    isFilterActive() {
        return Template.instance().searchString.get().length > 0;
    },
    isRunning() {
        let tmpl = Template.instance();
        let projectId = tmpl.data && tmpl.data.project && tmpl.data.project._id;
        let activeTimeEntry = TimeEntries.findOne({_isActive: true});
        return VZ.TimeTracker.instance.isRunning.get() && projectId == activeTimeEntry.projectId;
    },
    timeElapsed() {
        if (VZ.TimeTracker.instance.isRunning.get()) {
            let secondsElapsed = VZ.TimeTracker.instance.timeElapsed.get(),
                millisec = secondsElapsed * 1000;
            let hours = parseInt(moment.duration(millisec).asHours());
            if (hours < 10) {
                hours = "0" + hours;
            }
            return hours + moment.utc(millisec).format(":mm:ss")
        }
        else
            return "00:00:00";
    }
});

Template.projectTimeTracker.events({
    'mousedown #search-history-item': function (event, tmpl) {
        let taskKey = this.taskKey;
        let taskName = this.name;
        tmpl.$('#time-entry-message').val(taskKey + ': ' + taskName);
        tmpl.searchString.set('');
    },
    'input #time-entry-message': function (event, tmpl) {
        event.preventDefault();
        let searchString = tmpl.$('#time-entry-message').val();
        tmpl.searchString.set(searchString);
    },
    'click #start-tracking': function (event, tmpl) {
        let message = tmpl.$('#time-entry-message').val();

        if (message.length < 2) {
            VZ.notify('The message is too short.', 3000);
            return;
        }

        if (message.length > 200) {
            VZ.notify('Not allowed more than 200 characters');
            return;
        }

        try {
            VZ.TimeTracker.instance.startTracking(message, tmpl.data.project._id, false, []);
        }
        catch (error) {
            console.error(error);
            VZ.notify(error.error);
        }
    },
    'click #stop-tracking': function (event, tmpl) {
        event.preventDefault();
        VZ.TimeTracker.instance.stopTracking();
        tmpl.$('#time-entry-message').val('');
    }
});