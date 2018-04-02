import './time-tracker-show-entry.html';

import { VZ } from '/imports/startup/both/namespace';
import { Projects } from '/imports/api/projects/projects';
import { EntryTags } from '/imports/api/entryTags/entryTags';
import { removeTimeEntry } from '/imports/api/timeEntries/methods';

Template.showTimeEntry.onCreated(function () {
    let entry = this.data.entry;
    if(entry && entry.tags && entry.tags.length > 0){
        this.subscribe('tagsForEntry', entry.tags);
    }
});

Template.showTimeEntry.helpers({
    betweenHours() {
        let format = 'MMM Do YYYY, HH:mm';
        return moment(this.entry.startDate).format(format)
            + ' - ' + moment(this.entry.endDate).format(format);
    },

    duration() {
        let duration = moment(this.entry.endDate).diff(this.entry.startDate), //milliseconds
            hours = parseInt(moment.duration(duration).asHours());
        if (hours < 10) {
            hours = '0' + hours;
        }
        return hours + moment.utc(duration).format(':mm:ss')
    },

    project() {
        let project = Projects.findOne(Template.currentData().entry.projectId);
        if (project && project.name)
            return Projects.findOne(Template.currentData().entry.projectId).name;
        else
            return 'No project';

    },

    hasProject() {
        return !!Projects.findOne(Template.currentData().entry.projectId);
    },

    shouldBeDisplayedUserName() {
        return this.entry.userId != Meteor.userId();
    },
    
    tags() {
        let tags = this.entry.tags;
        if(tags){
            return EntryTags.find({
                _id: {$in: tags}
            });
        }
    }
});

Template.showTimeEntry.events({
    'click .remove-entry': function (e, template) {
        let timeEntryId = template.data.entry._id,
            modalMessage = 'Are you sure you want to delete this time entry?',
            onConfirm = function () {
                removeTimeEntry.call({timeEntryId}, function (err) {
                    if (err) {
                        VZ.notify(err);
                    }
                });
            };

        VZ.UI.confirmModal({
            message: modalMessage,
            onConfirm: onConfirm
        });
    },

    'click .edit-entry': function (e, t) {
        t.data.stateCb(true);
    }
});

Template.showTimeEntry.onRendered(function () {
    this.$('.dropdown-button').dropdown({
        // inDuration: 300,
        // outDuration: 225,
        // constrain_width: true, // Does not change width of dropdown to that of the activator
        // hover: false, // Activate on hover
        // gutter: 30, // Spacing from edge
        // belowOrigin: true, // Displays dropdown below the button
        // alignment: 'right' // Displays dropdown with edge aligned to the left of button
    });


    // http://stackoverflow.com/questions/29832371/meteor-materialize-collapsable-in-for-each-doesnt-work
    // this.autorun(() => {
    //      // registers a dependency on the number of documents returned by the cursor
    //     let entries = TimeEntries.find({ _done : true }).fetch();

    //     // this will log 0 at first, then after the jobs publication is ready
    //     // it will log the total number of documents published
    //     // console.log(entries);

    //     // initialize the plugin only when Blaze is done with DOM manipulation
    //     Tracker.afterFlush(function(){

    //       $('.dropdown-button').dropdown({
    //             inDuration: 300,
    //             outDuration: 225,
    //             constrain_width: true, // Does not change width of dropdown to that of the activator
    //             hover: false, // Activate on hover
    //             gutter: 30, // Spacing from edge
    //             belowOrigin: false, // Displays dropdown below the button
    //             alignment: 'left' // Displays dropdown with edge aligned to the left of button
    //         });

    //     }.bind(this));
    // }.bind(this));

});