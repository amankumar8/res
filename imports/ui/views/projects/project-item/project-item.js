import { VZ } from '/imports/startup/both/namespace';
import { archiveProject } from '/imports/api/projects/methods';

import './project-item.html';

Template.projectItem.onCreated(function () {
});

Template.projectItem.onRendered(function () {
    this.$('.tooltipped').tooltip({delay: 100, position: 'bottom'});
});

Template.projectItem.onDestroyed(function () {
    this.$('.tooltipped').tooltip('remove');
});

Template.projectItem.helpers({
    canEditProject() {
        return VZ.canUser('editProject', Meteor.userId(), this._id);
    }
});

Template.projectItem.events({
    'click .archive-project-button': function (event, tmpl) {
        let projectId = tmpl.data._id;
        archiveProject.call({projectId}, function (err) {
            if (err) {
                VZ.notify(err);
            } else {
                VZ.notify("Successfully archived!");
            }
        });
    }
});
