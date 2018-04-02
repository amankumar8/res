import {VZ} from '/imports/startup/both/namespace';
import {updateSelectedJobId} from '/imports/api/users/methods';

import './jobs-list.html';
import './all-jobs';
import './archived-jobs';
import './my-jobs/my-jobs'
import './worker-jobs/worker-jobs'
import './favorite-users/favorite-users'
import './favorite-companies/favorite-companies'

Template.jobsList.onCreated(function () {
  let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
  if (userProfile && userProfile.profile && userProfile.profile.selectedCompanyId) {
    this.currentTab = new ReactiveVar('allJobs');
  } else {
    this.currentTab = new ReactiveVar('myJobs');
  }
});

Template.jobsList.onRendered(function () {
  this.$('ul.tabs').tabs();
});

Template.jobsList.helpers({
  tab() {
    let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
    if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
      Template.instance().currentTab.set('workerJobs');
      return Template.instance().currentTab.get();
    } else {
      return Template.instance().currentTab.get();
    }
  },
  formСhanged() {
    return Session.get('jobsFormChanged');
  },
  companyOrWorkerView() {
    let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
    if (userProfile && userProfile.profile && userProfile.profile.selectedCompanyId) {
      return 'workerJobs';
    } else {
      return 'myJobs';
    }
  },
  isSelectedCompany() {
    let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
    return !!(userProfile && userProfile.profile && userProfile.profile.selectedCompanyId);
  },
  accent(tab) {
    if (tab === Template.instance().currentTab.get()) {
      return 'tab-accent-white';
    }
  },
  active(tab) {
    if (tab === Template.instance().currentTab.get()) {
      return 'active';
    }
  }
});

Template.jobsList.events({
  'click .tab': function(event, template) {
    let a = event.target;
    if(a.innerText === 'ALL JOBS') {
      template.currentTab.set('allJobs');
        updateSelectedJobId.call({}, function (error, result) {
            if (error) {
                VZ.notify(error.message);
            }
        });
    } else if(a.innerText === 'ARCHIVED JOBS') {
      template.currentTab.set('archivedJobs');
        updateSelectedJobId.call({}, function (error, result) {
            if (error) {
                VZ.notify(error.message);
            }
        });
    } else if(a.innerText === 'MY JOBS') {
      template.currentTab.set('myJobs');
        updateSelectedJobId.call({}, function (error, result) {
            if (error) {
                VZ.notify(error.message);
            }
        });

    } else if(a.innerText === 'FAVORITE TALENTS') {
        template.currentTab.set('favoriteUsers');
        updateSelectedJobId.call({}, function (error, result) {
            if (error) {
                VZ.notify(error.message);
            }
        });
    } else if(a.innerText === 'FAVORITE COMPANIES') {
        template.currentTab.set('favoriteCompanies');
        updateSelectedJobId.call({}, function (error, result) {
            if (error) {
                VZ.notify(error.message);
            }
        });
    }
  }
});