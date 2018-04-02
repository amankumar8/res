import { VZ } from '/imports/startup/both/namespace';
import { archiveJob, restoreJob} from '/imports/api/jobs/methods';
import './jobs-actions.html';

Template.jobsActions.onRendered(function () {
    this.$('.dropdown-button').dropdown({
        inDuration: 100,
        outDuration: 125,
        constrain_width: false, // Does not change width of dropdown to that of the activator
        hover: false, // Activate on hover
        gutter: 0, // Spacing from edge
        // belowOrigin: false, // Displays dropdown below the button
        alignment: 'right' // Displays dropdown with edge aligned to the left of button
    });
});

Template.jobsActions.helpers({
});

Template.jobsActions.events({
    'click .archive-job-button': function (event, tmpl) {
        event.preventDefault();
        let jobId= this.data._id;
        archiveJob.call({jobId:jobId}, (err, res) => {
            if (!err) {
                VZ.notify('Archived');
            } else {
                let message = err.reason || err.message;
                VZ.notify(message);
            }
        });
    },
    'click .restore-job-button': function (event, tmpl) {
        event.preventDefault();
        let jobId= this.data._id;
        restoreJob.call({jobId:jobId}, (err, res) => {
            if (!err) {
                VZ.notify('Restored');
            } else {
                let message = err.reason || err.message;
                VZ.notify(message);
            }
        });
    },
    'click #edit': function (event, template) {
        const modalData = {
            actionsTemplate: 'jobCreateEditModalActions',
            headTemplate: 'jobCreateEditModalHead',
            headTemplateData: {jobId: template.data.data._id},
            detailsTemplate: 'jobCreateEditModalDetails',
            detailsTemplateData: {jobId: template.data.data._id},
            asideTemplate: 'jobCreateEditModalAside',
            asideTemplateData: {jobId: template.data.data._id}
        };
        Blaze.renderWithData(Template.rightDrawerModal, modalData, document.body);
    }
});