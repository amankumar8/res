import { Jobs } from '/imports/api/jobs/jobs';

import './worker-jobs.html';
import './applications/applications.html';
import './applications/applications';
import './archived-workers/archived-workers.html';
import './archived-workers/archived-workers';
import './hired-jobs/hired-jobs.html';
import './hired-jobs/hired-jobs';
import './shortlisted/shortlisted.html';
import './shortlisted/shortlisted';
import './invited-workers/invited-workers';

Template.workerJobs.onCreated(function () {
    this.currentTab2 = new ReactiveVar('applications');
});

Template.workerJobs.helpers({
    tab2() {
        return Template.instance().currentTab2.get();
    },
    hideArrow(tab) {
        if (tab === Template.instance().currentTab2.get()) {
            return 'hide-arrow';
        }
    },
    active(tab) {
        if (tab === Template.instance().currentTab2.get()) {
            return 'active';
        }
    },
    applicationsCount(){
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            let job = Jobs.findOne({_id: userProfile.profile.selectedJobId}, {fields: {applicantsIds: 1}});
            if (job && job.applicantsIds) {
                return job.applicantsIds.length;
            } else {
                return '0'
            }
        }
    },
    invitedWorkersCount(){
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            let job = Jobs.findOne({_id: userProfile.profile.selectedJobId}, {fields: {invitedUserIds: 1}});
            if (job && job.invitedUserIds) {
                return job.invitedUserIds.length;
            } else {
                return '0'
            }
        }
    },
    archivedWorkerCount(){
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            let job = Jobs.findOne({_id: userProfile.profile.selectedJobId}, {fields: {archivedApplicantsIds: 1}});
            if (job && job.archivedApplicantsIds) {
                return job.archivedApplicantsIds.length;
            } else {
                return '0'
            }
        }
    },
    hiredWorkerCount(){
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            let job = Jobs.findOne({_id: userProfile.profile.selectedJobId}, {fields: {hiredApplicantsIds: 1}});
            if (job && job.hiredApplicantsIds) {
                return job.hiredApplicantsIds.length;
            } else {
                return '0'
            }
        }
    },
    shortlistedWorkerCount(){
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            let job = Jobs.findOne({_id: userProfile.profile.selectedJobId}, {fields: {shortlistedApplicantsIds: 1}});
            if (job && job.shortlistedApplicantsIds) {
                return job.shortlistedApplicantsIds.length;
            } else {
                return '0'
            }
        }
    }
});

Template.workerJobs.onRendered(function () {
    this.$('ul.tabs').tabs();
    $(document).on('click', 'li.action .dropdown-content', function (e) {
        e.stopPropagation();
    });
    $(document).on('click', '#user-switch-dropdown', function (e) {
        e.stopPropagation();
    });
    $(document).on('click', '#notification-dropdown', function (e) {
        e.stopPropagation();
    });
});

Template.workerJobs.events({
    'click .tab': function (event, tmpl) {
        let currentTab2 = tmpl.$(event.target).closest('li');
        tmpl.currentTab2.set(currentTab2.data('template'));
    }
});