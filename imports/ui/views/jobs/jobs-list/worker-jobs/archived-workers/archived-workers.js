import './archived-workers.html';
import '../worker-job-item/worker-job-item';
import { Jobs, SALARY_TYPE } from '/imports/api/jobs/jobs';
import { Companies } from '/imports/api/companies/companies';
import {resizeWindow, sortByFiltersWorkers, inputWorkerName} from '../../utils';

Template.archivedWorkers.onCreated(function () {
    this.limitArchivedWorkers = new ReactiveVar(5);
    this.filters = new ReactiveVar({});
    Session.set('typeWorkers', 'archived');
    this.query = new ReactiveVar('');
});

Template.archivedWorkers.onRendered(function () {
    resizeWindow(this.limitArchivedWorkers);
});

Template.archivedWorkers.helpers({
    usersArchived(){
        let tmpl = Template.instance();
        let filters = tmpl.filters.get();
        let users = [];
        tmpl.subscribe('user', Meteor.userId());
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});

        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            tmpl.subscribe('job', userProfile.profile.selectedJobId);
            let job = Jobs.findOne({_id: userProfile.profile.selectedJobId}, {fields: {archivedApplicantsIds: 1}});
            if (job && job.archivedApplicantsIds) {
                for (let i = 0; i < job.archivedApplicantsIds.length; i++) {
                    tmpl.subscribe('userById', job.archivedApplicantsIds[i]);
                    let user = Meteor.users.findOne(job.archivedApplicantsIds[i]);
                    if (user && user.profile) {
                        if (user.profile.fullName.toLowerCase().search(tmpl.query.get()) !== -1) {
                            users.push(Meteor.users.findOne(job.archivedApplicantsIds[i]))
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

Template.archivedWorkers.events({
    'input #job-title'(eventArchivedWorkers, tmplArchivedWorkers){
        inputWorkerName(tmplArchivedWorkers);
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
    'click ul.rating-sort-archivedWorkers li'(eventArchivedWorkers, tmplArchivedWorkers){

    }
});