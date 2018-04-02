import './invations.html';
import '../user-job-item/user-job-item.js';
import { Jobs, SALARY_TYPE } from '/imports/api/jobs/jobs';
import { Companies } from '/imports/api/companies/companies';
import {resizeWindow, sortByFilters, inputJobTitle} from '../../utils';

Template.invitations.onCreated(function () {
    this.limitActive = new ReactiveVar(5);
    this.queryActive = new ReactiveVar({invitedUserIds: Meteor.userId(), isArchived: false});
    this.sortActive = new ReactiveVar({createdAt: -1});
    this.filtersActive = new ReactiveVar({});

    this.autorun(() => {
        let limitActive = this.limitActive.get();
        let queryActive = _.clone(this.queryActive.get());
        let sortActive = _.clone(this.sortActive.get());
        Session.set('active-jobs-query', queryActive);
        Session.set('typeJobs', 'invations');
        this.subscribe('jobs', queryActive, {sort: sortActive, limit: limitActive});
    });
});

Template.invitations.onRendered(function () {
    resizeWindow(this.limitActive);
});

Template.invitations.helpers({
    jobs(){
        let tmplActive = Template.instance();
        let filtersActive  = tmplActive.filtersActive.get();
        let limitActive = tmplActive.limitActive.get();
        let queryActive = tmplActive.queryActive.get();
        let jobs = Jobs.find(queryActive, {sort: {createdAt: -1}, limit: limitActive}).fetch();
        sortByFilters(jobs, filtersActive);
        return jobs;
    }
});

Template.invitations.events({
    'input #job-title-active'(eventActive, tmplActive){
        inputJobTitle(tmplActive);
    },
    'click ul.company1-sort-active li'(eventActive, tmplActive){
        eventActive.preventDefault();
        tmplActive.filtersActive.set({companySortOrder: tmplActive.$(eventActive.currentTarget).prop('id')});
    },
    'click ul.salary-sort-active li'(eventActive, tmplActive){
        eventActive.preventDefault();
        tmplActive.filtersActive.set({sortOrder: tmplActive.$(eventActive.currentTarget).prop('id')});
    },
    'click ul.rating-sort-active li'(eventActive, tmplActive){
        eventActive.preventDefault();
        //let sortOrder = tmpl.$(event.currentTarget).prop('id');
    }
});
