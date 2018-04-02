import './favorite-companies.html';
import '../worker-jobs/worker-job-item/worker-job-item';
import './company-item';
import { Companies } from '/imports/api/companies/companies';
import {resizeWindow, sortByFiltersWorkers, inputWorkerName } from '../utils';

Template.favoriteCompanies.onCreated(function () {
    this.limit = new ReactiveVar(5);
    this.filters = new ReactiveVar({});
    this.query = new ReactiveVar();
});

Template.favoriteCompanies.onRendered(function () {
    resizeWindow(this.limit);
});

Template.favoriteCompanies.helpers({
    companies(){
        let tmpl = Template.instance();
        let filters = tmpl.filters.get();
        let companiesToShow = [];
        tmpl.subscribe('user', Meteor.userId());
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});

        if (userProfile && userProfile.profile && userProfile.profile.selectedCompanyId) {
            console.error('Selected company, not user');
            return false;
        } else {
            tmpl.subscribe('favoriteCompaniesForUser');
            let companies = Companies.find({addedToFavoriteUsersIds: Meteor.userId()}).fetch();
            for (let i = 0; i < companies.length; i++) {
                if (companies[i].name.toLowerCase().search(tmpl.query.get()) !== -1) {
                    companiesToShow.push(companies[i])
                }
            }
            if (companiesToShow) {
                sortByFiltersWorkers(companiesToShow, filters);
                return companiesToShow;
            }
        }
    }
});

Template.favoriteCompanies.events({
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