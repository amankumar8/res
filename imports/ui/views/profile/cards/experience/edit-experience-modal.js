import { VZ } from '/imports/startup/both/namespace';
import { addWorkExperience } from '/imports/api/userWorkExperience/methods';

import './edit-experience-modal.html';

Template.editExperienceModal.onCreated(function () {
    let isWorking = this.data.jobProject ? this.data.jobProject.isWorking : false;
    this.isWorking = new ReactiveVar(isWorking);
});

Template.editExperienceModal.onRendered(function () {
    let self = this;
    this.$('.modal').modal();
    this.$('.modal').modal('open');
    $('.datepicker').pickadate({
        selectMonths: true,
        selectYears: 15
    });
    this.$('textarea#job-description').characterCounter();
    this.$('#job-description').trigger('autoresize');
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
    let startDate = this.$('#start-date').pickadate('picker');
    let completeDate = this.$('#complete-date').pickadate('picker');


    if (this.data.jobProject) {
        startDate.set('select', this.data.jobProject.startAt);
        if(!this.data.jobProject.isWorking){
        completeDate.set('select', this.data.jobProject.completeAt);
        }
    }

});
Template.editExperienceModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});
Template.editExperienceModal.helpers({
    currentlyWorking() {
        return Template.instance().isWorking.get();
    }
});

Template.editExperienceModal.events({
    'change #filled-in-box': function (event, tmpl) {
        event.preventDefault();
        let isWorking = event.target.checked;
        tmpl.isWorking.set(isWorking);
    },
    'click .save': function (event, tmpl) {
        event.preventDefault();
        let company = tmpl.$('#company').val().trim();
        let title = tmpl.$('#title').val().trim();
        let description = tmpl.$('#job-description').val().trim();
        let isWorking = tmpl.isWorking.get();
        let startDatePicker = tmpl.$('#start-date').pickadate('picker');
        let startDate = new Date(startDatePicker.get());
        let completeDatePicker = tmpl.$('#complete-date').pickadate('picker');
        let comleteDate = new Date(completeDatePicker.get());

        let job = {
            title: title,
            company: company,
            description: description,
            startAt: startDate,
            isWorking: isWorking
        };

        let isValidStart = moment(startDate).isValid();
        let isValidComplete = moment(comleteDate).isValid();
        if (!isWorking && isValidComplete) {
            job.completeAt = comleteDate;
        }
        else if (!isWorking && !isValidComplete) {
            VZ.notify('Select complete date');
            return;
        }
        else if(!isValidStart){
            VZ.notify('Select start date');
            return;
        }
        tmpl.data.onJobInsertEdit(job, tmpl);
    },
    'click .cancel': function (event, tmpl) {
        event.preventDefault();
        tmpl.$('#edit-experience-modal').modal('close');
        removeTemplate(tmpl.view);
    },
    'click .add-more': function (event, tmpl) {
        event.preventDefault();
        let company = tmpl.$('#company').val().trim();
        let title = tmpl.$('#title').val().trim();
        let description = tmpl.$('#job-description').val().trim();
        let isWorking = tmpl.isWorking.get();
        let startDatePicker = tmpl.$('#start-date').pickadate('picker');
        let startDate = new Date(startDatePicker.get());
        let completeDatePicker = tmpl.$('#complete-date').pickadate('picker');
        let comleteDate = new Date(completeDatePicker.get());

        let job = {
            title: title,
            company: company,
            description: description,
            startAt: startDate,
            isWorking: isWorking
        };

        let isValidStart = moment(startDate).isValid();
        if(!isValidStart){
            VZ.notify('Select start date');
            return;
        }
        let isValidComplete = moment(comleteDate).isValid();
        if (!isWorking && isValidComplete) {
            job.completeAt = comleteDate;
        }
        else if (!isWorking && !isValidComplete) {
            VZ.notify('Select complete date');
            return;
        }
        addWorkExperience.call(job, function (error, result) {
            if (!error) {
                VZ.notify('Success');
                let startDatePicker = tmpl.$('#start-date').pickadate('picker');
                let completeDatePicker = tmpl.$('#complete-date').pickadate('picker');

                tmpl.$('#company').val('');
                tmpl.$('#title').val('');
                tmpl.$('#job-description').val('');
                startDatePicker.clear();
                completeDatePicker.clear();
                tmpl.isWorking.set(false);
            }
            else {
                VZ.notify(error.message.replace(/[[0-9]+]/gi, ''));
            }
        });
    }
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};