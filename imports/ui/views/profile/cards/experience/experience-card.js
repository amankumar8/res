import {VZ} from '/imports/startup/both/namespace';
import {addWorkExperience} from '/imports/api/userWorkExperience/methods';

import './experience-card.html';

import {UserWorkExperience} from '/imports/api/userWorkExperience/userWorkExperience';

Template.experienceCard.onCreated(function () {
  this.jobsLimit = new ReactiveVar(2);
  this.autorun(() => {
    let userId = Router.current().params.id;
    this.subscribe('userWorkExperience', userId, this.jobsLimit.get());
  });
});

Template.experienceCard.onRendered(function () {
});

Template.experienceCard.onDestroyed(function () {
});

Template.experienceCard.helpers({
  profileOwner() {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    return user && Meteor.userId() === user._id;
  },
  userWorkExperience() {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (!user || !user.profile) {
      return;
    }
    if (user.profile.workExperienceIds) {
      let workExperience = user.profile.workExperienceIds;
      return UserWorkExperience.find({_id: {$in: workExperience}}, {
        sort: {
          startAt: -1
        },
        limit: Template.instance().jobsLimit.get()
      });
    }
  },
  showLess() {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (!user || !user.profile) {
      return;
    }
    if (user.profile.workExperienceIds) {
      return Template.instance().jobsLimit.get() === user.profile.workExperienceIds.length && Template.instance().jobsLimit.get() > 2;
    }

  },
  showMore() {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (!user || !user.profile) {
      return;
    }

    if (user.profile.workExperienceIds) {
      return Template.instance().jobsLimit.get() < user.profile.workExperienceIds.length;
    }
  }
});
Template.experienceCard.events({
  'click .add-job-icon': function (event, tmpl) {
    event.preventDefault();
    let parentNode = $('body')[0],
      onJobInsertEdit = function (job, experienceTmpl) {
        addWorkExperience.call(job, function (error, result) {
          if (!error) {
            experienceTmpl.$('#edit-experience-modal').modal('close');
            removeTemplate(experienceTmpl.view);
            VZ.notify('Success');
          }
          else {
            VZ.notify(error.message.replace(/[[0-9]+]/gi, ''));
          }
        });
      },
      modalData = {
        onJobInsertEdit: onJobInsertEdit
      };
    Blaze.renderWithData(Template.editExperienceModal, modalData, parentNode);
  },
  'click .load-more': function (event, tmpl) {
    event.preventDefault();
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (!user || !user.profile) {
      return;
    }
    let jobsToShow = user.profile.workExperienceIds.length || 2;
    tmpl.jobsLimit.set(jobsToShow);
  },
  'click .show-less': function (event, tmpl) {
    event.preventDefault();
    tmpl.jobsLimit.set(2);
  }

});
let removeTemplate = function (view) {
  setTimeout(function () {
    Blaze.remove(view);
  }, 500);
};