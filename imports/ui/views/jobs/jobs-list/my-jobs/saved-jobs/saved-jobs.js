import './saved-jobs.html';
import '../user-job-item/user-job-item.js';
import { Jobs, SALARY_TYPE } from '/imports/api/jobs/jobs';
import { Companies } from '/imports/api/companies/companies';
import {resizeWindow, sortByFilters, inputJobTitle} from '../../utils';

Template.savedJobs.onCreated(function () {
    //let self = this;
    this.limit = new ReactiveVar(5);
    this.query = new ReactiveVar({userSavedJobIds: Meteor.userId()});
    this.sort = new ReactiveVar({createdAt: -1});
    this.filters = new ReactiveVar({});

    this.autorun(() => {
        let limit = this.limit.get();
        let query = _.clone(this.query.get());
        let sort = _.clone(this.sort.get());
        Session.set('archived-jobs-query', query);
        Session.set('typeJobs', 'saved');
        this.subscribe('jobs', query, {sort: sort, limit: limit});
        //this.subscribe('jobsByType', query, {sort: sort, limit: limit});
    });
});

Template.savedJobs.onRendered(function () {
    resizeWindow(this.limit);
});

Template.savedJobs.helpers({
    jobs(){
        let tmpl = Template.instance();
        let limit = tmpl.limit.get();
        let filters  = tmpl.filters.get();
        let query = tmpl.query.get();
        let jobs = Jobs.find(query, {sort: {createdAt: -1}, limit: limit}).fetch();
        sortByFilters(jobs, filters);
        return jobs;
    }
});

Template.savedJobs.events({
    'input #job-title'(event, tmpl){
        inputJobTitle(tmpl);
    },
    'click ul.company1-sort li'(event, tmpl){
        event.preventDefault();
        let sortOrder = tmpl.$(event.currentTarget).prop('id');
        tmpl.filters.set({companySortOrder: sortOrder});
    },
    'click ul.salary-sort li'(event, tmpl){
        event.preventDefault();
        let sortOrder = tmpl.$(event.currentTarget).prop('id');
        tmpl.filters.set({sortOrder: sortOrder});
    },
    'click ul.rating-sort li'(event, tmpl){
        event.preventDefault();
        //let sortOrder = tmpl.$(event.currentTarget).prop('id');
    }
});
