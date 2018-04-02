import './hired-jobs.html';
import '../worker-job-item/worker-job-item';
import { Jobs, SALARY_TYPE } from '/imports/api/jobs/jobs';
import { Companies } from '/imports/api/companies/companies';
import {resizeWindow, sortByFiltersWorkers, inputWorkerName} from '../../utils';

Template.hiredJobs.onCreated(function () {
    this.limitHired = new ReactiveVar(5);
    this.filters = new ReactiveVar({});
    Session.set('typeWorkers', 'hired');
    this.query = new ReactiveVar({});
});

Template.hiredJobs.onRendered(function () {
    resizeWindow(this.limitHired);
});

Template.hiredJobs.helpers({
    usersHired(){
        let tmpl = Template.instance();
        let filters = tmpl.filters.get();
        tmpl.subscribe('user', Meteor.userId());
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        let users = [];

        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            tmpl.subscribe('job', userProfile.profile.selectedJobId);
            let job = Jobs.findOne({_id: userProfile.profile.selectedJobId}, {fields: {hiredApplicantsIds: 1}});
            if (job && job.hiredApplicantsIds) {
                for (let i = 0; i < job.hiredApplicantsIds.length; i++) {
                    tmpl.subscribe('userById', job.hiredApplicantsIds[i]);
                    let user = Meteor.users.findOne(job.hiredApplicantsIds[i]);
                    if (user && user.profile) {
                        if (user.profile.fullName.toLowerCase().search(tmpl.query.get()) !== -1) {
                            users.push(Meteor.users.findOne(job.hiredApplicantsIds[i]))
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

Template.hiredJobs.events({
    'input #job-title'(eventHired, tmplHired){
        inputWorkerName(tmplHired);
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
    'click ul.rating-sort-hired li'(eventHired, tmplHired){
    }
});
