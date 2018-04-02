import './applications.html';
import '../worker-job-item/worker-job-item';
import { Jobs, SALARY_TYPE } from '/imports/api/jobs/jobs';
import { Companies } from '/imports/api/companies/companies';
import {resizeWindow, sortByFiltersWorkers, inputWorkerName } from '../../utils';

Template.applications.onCreated(function () {
    this.limit = new ReactiveVar(5);
    this.filters = new ReactiveVar({});
    Session.set('typeWorkers', 'applications');
    this.query = new ReactiveVar({});
});

Template.applications.onRendered(function () {
    resizeWindow(this.limit);
});

Template.applications.helpers({
    users(){
        let tmpl = Template.instance();
        let filters = tmpl.filters.get();
        let users = [];
        tmpl.subscribe('user', Meteor.userId());
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});

        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            tmpl.subscribe('job', userProfile.profile.selectedJobId);
            let job = Jobs.findOne({_id: userProfile.profile.selectedJobId}, {fields: {applicantsIds: 1}});
            if (job && job.applicantsIds) {
                for (let i = 0; i < job.applicantsIds.length; i++) {
                    tmpl.subscribe('userById', job.applicantsIds[i]);
                    let user = Meteor.users.findOne(job.applicantsIds[i]);
                    if (user && user.profile) {
                        if (user.profile.fullName.toLowerCase().search(tmpl.query.get()) !== -1) {
                            users.push(Meteor.users.findOne(job.applicantsIds[i]))
                        }
                    }

                }
            }
        }

        if (users) {
            sortByFiltersWorkers(users, filters);
            return users;
        }
    }
});

Template.applications.events({
    'input #job-title'(eventActive, tmplActive){
        inputWorkerName(tmplActive);
    },
    'click ul.company1-sort-applications li'(eventApplications, tmplApplications){
        eventApplications.preventDefault();
        let sortOrder = tmplApplications.$(eventApplications.currentTarget).prop('id');
        tmplApplications.filters.set({companySortOrder: sortOrder});
    },
    'click ul.salary-sort-applications li'(eventApplications, tmplApplications){
        eventApplications.preventDefault();
        let sortOrder = tmplApplications.$(eventApplications.currentTarget).prop('id');
        tmplApplications.filters.set({companySortOrder: sortOrder});
    },
    'click ul.rating-sort-applications li'(eventApplications, tmplApplications){
        eventApplications.preventDefault();
        let sortOrder = tmplApplications.$(eventApplications.currentTarget).prop('id');
        tmplApplications.filters.set({sortOrder: sortOrder});
    }
});