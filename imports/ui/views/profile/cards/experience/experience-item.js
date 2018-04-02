import { VZ } from '/imports/startup/both/namespace';
import { updateWorkExperience, removeWorkExperience } from '/imports/api/userWorkExperience/methods';

import './experience-item.html';

import { UserWorkExperience } from '/imports/api/userWorkExperience/userWorkExperience';

Template.experienceItem.onCreated(function () {
    this.showMore = new ReactiveVar(false);
});
Template.experienceItem.onDestroyed(function () {
});
Template.experienceItem.onRendered(function () {

});
Template.experienceItem.helpers({
    profileOwner() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        return user && Meteor.userId() == user._id;
    },
    workingPeriod(){
        if(this.data.isWorking){
            return moment(this.data.startAt).format('YYYY') + ' - present';
        }
        else{
            return moment(this.data.startAt).format('YYYY') + ' - ' + moment(this.data.completeAt).format('YYYY');
        }
    },
    description() {
        let biography = this.data.description;
        let new_text, small_len = 200;

            if (this.data.description.length > 200 && !Template.instance().showMore.get()) {
                new_text = biography.substr(0, (small_len - 3)) + '...';
                return new_text;
            }
            return this.data.description;
    },
    showMore() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        return this.data.description.length > 200 && Template.instance().showMore.get();
    },
    showMoreButton() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        return this.data.description.length > 200;
    },
});
Template.experienceItem.events({
    'click .edit-job': function (event, tmpl) {
        event.preventDefault();
        const jobId = this.data._id;
        let jobProject = UserWorkExperience.findOne({_id: jobId});
        let parentNode = $('body')[0],
            onJobInsertEdit = function (job, experienceTmpl) {
                job._id = jobId;
                updateWorkExperience.call(job, function (error, result) {
                    if (!error) {
                        experienceTmpl.$('#edit-portfolio-modal').modal('close');
                        removeTemplate(experienceTmpl.view);
                        VZ.notify('Success');
                    }
                    else {
                        VZ.notify(error.message.replace(/[[0-9]+]/gi, ''));
                    }
                });
            },
            modalData = {
                jobProject: jobProject,
                onJobInsertEdit: onJobInsertEdit
            };
        Blaze.renderWithData(Template.editExperienceModal, modalData, parentNode);
    },
    'click .remove-job': function (event, tmpl) {
        event.preventDefault();
        let jobId = this.data._id;
        removeWorkExperience.call({id: jobId}, function (error, result) {
            if(error){
                VZ.notify(error.message.replace(/[[0-9]+]/gi, ''));

            }
        });
    },
    'click .show-more-description': function (event, tmpl) {
        event.preventDefault();
        tmpl.showMore.set(true);
    },
    'click .show-less-description': function (event, tmpl) {
        event.preventDefault();
        tmpl.showMore.set(false);
    }
});
let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};