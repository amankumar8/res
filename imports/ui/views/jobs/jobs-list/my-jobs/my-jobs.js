/**
 * Created by andriimakar on 8/7/17.
 */
import './my-jobs.html';
import './active-jobs/active-jobs.html';
import './active-jobs/active-jobs.js';
import './saved-jobs/saved-jobs';
import './invations/invations.html';
import './invations/invations.js';
import './proposals/proposals.html';
import './proposals/proposals.js';
import {Jobs} from '/imports/api/jobs/jobs';

Template.myJobs.onCreated(function () {
    this.currentTab1 = new ReactiveVar('activeJobs');
});

Template.myJobs.helpers({
    tab1() {
        return Template.instance().currentTab1.get();
    },
    activeJobsCount(){
        Template.instance().subscribe('jobs', {$or: [{applicantsIds: Meteor.userId()}, {ownerId: Meteor.userId()}], isArchived: false});
        return Jobs.find({$or: [{applicantsIds: Meteor.userId()}, {ownerId: Meteor.userId()}], isArchived: false}).count();
    },
    invitedJobsCount() {
        Template.instance().subscribe('jobs', {invitedUserIds: Meteor.userId(), isArchived: false});
        return Jobs.find({invitedUserIds: Meteor.userId(), isArchived: false}).count();
    },
    hiredJobsCount() {
        Template.instance().subscribe('jobs', {hiredApplicantsIds: Meteor.userId(), isArchived: false});
        return Jobs.find({hiredApplicantsIds: Meteor.userId(), isArchived: false}).count();
    },
    savedJobsCount(){
        Template.instance().subscribe('jobs', {userSavedJobIds: Meteor.userId()});
        return Jobs.find({userSavedJobIds: Meteor.userId()}).count();
    },
    hideArrow(tab) {
        if (tab === Template.instance().currentTab1.get()) {
            return 'hide-arrow';
        }
    },
    active(tab) {
        if (tab === Template.instance().currentTab1.get()) {
            return 'active';
        }
    }
});

Template.myJobs.onRendered(function () {
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

Template.myJobs.events({
    'click .tab': function (event, template) {
        let id = $(event.currentTarget).prop('id');
        template.currentTab1.set(id);
    }
});