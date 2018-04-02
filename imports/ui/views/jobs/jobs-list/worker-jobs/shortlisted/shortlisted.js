import './shortlisted.html';
import '../worker-job-item/worker-job-item';
import { Jobs, SALARY_TYPE } from '/imports/api/jobs/jobs';
import { Companies } from '/imports/api/companies/companies';
import {resizeWindow, sortByFiltersWorkers, inputWorkerName} from '../../utils';

Template.shortlisted.onCreated(function () {
    this.limitShortlisted = new ReactiveVar(5);
    this.filters= new ReactiveVar({});
    Session.set('typeWorkers', 'shortlisted');
    this.query = new ReactiveVar({});
});

Template.shortlisted.onRendered(function () {
    resizeWindow(this.limitShortlisted);
});

Template.shortlisted.helpers({
    usersShortlisted(){
        let tmpl = Template.instance();
        let filters = tmpl.filters.get();
        tmpl.subscribe('user', Meteor.userId());
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        let users = [];

        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            tmpl.subscribe('job', userProfile.profile.selectedJobId);
            let job = Jobs.findOne({_id: userProfile.profile.selectedJobId}, {fields: {shortlistedApplicantsIds: 1}});
            if (job && job.shortlistedApplicantsIds) {
                for (let i = 0; i < job.shortlistedApplicantsIds.length; i++) {
                    tmpl.subscribe('userById', job.shortlistedApplicantsIds[i]);
                    let user = Meteor.users.findOne(job.shortlistedApplicantsIds[i]);
                    if (user && user.profile) {
                        if (user.profile.fullName.toLowerCase().search(tmpl.query.get()) !== -1) {
                            users.push(Meteor.users.findOne(job.shortlistedApplicantsIds[i]))
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

Template.shortlisted.events({
    'input #job-title'(eventShortlisted, tmplShortlisted){
        inputWorkerName(tmplShortlisted);
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
    'click ul.rating-sort-shortlisted li'(eventShortlisted, tmplShortlisted){
    }
});
