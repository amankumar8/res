import './time-tracker-modal-proj.html';

import { Projects } from '/imports/api/projects/projects';

Template.timeTrackerProjectModalPicker.onRendered(function () {
    this.$('.modal').modal();
    this.$('.modal').modal('open');
    let self = this;
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
});

Template.timeTrackerProjectModalPicker.helpers({
    projects() {
        return Projects.find();
    }
});

Template.timeTrackerProjectModalPicker.events({
    'click .select-project-button': function (event, tmpl) {
        tmpl.data.onProjectSelected(this._id);
        tmpl.$('#time-tracker-project-modal-picker').modal('close');
        removeTemplate(tmpl.view);
    }
});

Template.timeTrackerProjectModalPicker.onDestroyed(function () {
    $('.modal-overlay').remove();
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};