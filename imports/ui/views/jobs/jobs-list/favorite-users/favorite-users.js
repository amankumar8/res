import './favorite-users.html';
import '../worker-jobs/worker-job-item/worker-job-item';
import { Companies } from '/imports/api/companies/companies';
import {resizeWindow, sortByFiltersWorkers, inputWorkerName } from '../utils';

Template.favoriteUsers.onCreated(function () {
    this.limit = new ReactiveVar(5);
    this.filters = new ReactiveVar({});
    this.query = new ReactiveVar({});
});

Template.favoriteUsers.onRendered(function () {
    resizeWindow(this.limit);
});

Template.favoriteUsers.helpers({
    users(){
        let tmpl = Template.instance();
        let filters = tmpl.filters.get();
        let users = [];
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});

        if (userProfile && userProfile.profile && userProfile.profile.selectedCompanyId) {
            let company = Companies.findOne({_id: userProfile.profile.selectedCompanyId}, {fields: {favoriteUsersIds: 1}});
            if (company && company.favoriteUsersIds) {
                for (let i = 0; i < company.favoriteUsersIds.length; i++) {
                    Template.instance().subscribe('user', company.favoriteUsersIds[i]);
                    if (Meteor.users.findOne(company.favoriteUsersIds[i]).profile.fullName.toLowerCase().search(tmpl.query.get()) !== -1) {
                        users.push(Meteor.users.findOne(company.favoriteUsersIds[i]))
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

Template.favoriteUsers.events({
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