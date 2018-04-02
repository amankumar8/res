import './companies-roles.html';
import {Roles} from 'meteor/alanning:roles';
import {Companies} from '/imports/api/companies/companies';
import {companyUserPositions} from '/imports/startup/both/user-positions/company';
import { VZ } from '/imports/startup/both/namespace';
import {updateUserCompanyRole, removeUserFromCompany, addUserToCompany} from '/imports/api/user-roles/methods';

Template.companiesRoles.onCreated(function () {
  this.assignedCompanies = new ReactiveVar([]);
  this.canBeAssignedCompanies = new ReactiveVar([]);
  this.searchString = new ReactiveVar('');

  this.getHidestRole = (userRoles) => {
    let ownerIndex = _.indexOf(userRoles, 'company-owner');
    let adminIndex = _.indexOf(userRoles, 'company-admin');
    let managerIndex = _.indexOf(userRoles, 'company-manager');
    let workerIndex = _.indexOf(userRoles, 'company-worker');
    let observerIndex = _.indexOf(userRoles, 'company-observer');

    if(ownerIndex != -1){
      return 'company-owner';
    }
    else if(adminIndex != -1){
      return 'company-admin';
    }
    else if(managerIndex != -1){
      return 'company-manager';
    }
    else if(workerIndex != -1){
      return 'company-worker';
    }
    else if(observerIndex != -1){
      return 'company-observer';
    }
    else {
      return '';
    }
  };

  this.autorun(() => {
    const userId = Router.current().params.id;

    let sub = this.subscribe('roles.assignedCompanies', userId);
    if (sub.ready()) {
      let companiesCreatedByUser = Roles.getGroupsForUser(userId, 'company-owner');
      let companiesWhereUserAdmin = Roles.getGroupsForUser(userId, 'company-admin');
      let companiesWhereUserManager = Roles.getGroupsForUser(userId, 'company-manager');
      let companiesWhereUserWorker = Roles.getGroupsForUser(userId, 'company-worker');
      let companiesWhereUserObserver = Roles.getGroupsForUser(userId, 'company-observer');

      let relatedCompaniesDirectly = _.union(companiesCreatedByUser,
        companiesWhereUserAdmin,
        companiesWhereUserManager,
        companiesWhereUserWorker,
        companiesWhereUserObserver);

      let relatedCompanies = Companies.find({_id: {$in: relatedCompaniesDirectly}, isArchived: false}).fetch();
      this.assignedCompanies.set(relatedCompanies);
    }
  });

  this.autorun(() => {
    const userId = Meteor.userId();
    let companiesCreatedByUser = Roles.getGroupsForUser(userId, 'company-owner');
    let companiesWhereUserAdmin = Roles.getGroupsForUser(userId, 'company-admin');
    let relatedCompaniesDirectly = _.union(companiesCreatedByUser, companiesWhereUserAdmin);
    let searchString = this.searchString.get();
    let assignedCompanies = _.clone(this.assignedCompanies.get());
    let assignedCompaniesIds = assignedCompanies.map((company) => {
      return company._id;
    });
    let companiesIds = _.difference(relatedCompaniesDirectly, assignedCompaniesIds);
    let query = {_id: {$in: companiesIds}, isArchived: false};
    if(searchString){
      let regex = new RegExp(searchString, 'gi');
      query.name = {$regex: regex};
    }
    let sub = this.subscribe('roles.canBeAssignedCompanies', assignedCompaniesIds, searchString);
    if (sub.ready()) {
      let relatedCompanies = Companies.find(query).fetch();
      this.canBeAssignedCompanies.set(relatedCompanies);
    }
  });
});
Template.companiesRoles.onRendered(function () {
  this.autorun(() => {
    this.assignedCompanies.get();
    setTimeout(() => {
      this.$('select').material_select();
    }, 700);
  });
});

Template.companiesRoles.helpers({
  assignedCompanies() {
    let tmpl = Template.instance();
    let assignedCompanies = _.clone(tmpl.assignedCompanies.get());
    return assignedCompanies;
  },
  companyUserPositions() {
    return companyUserPositions;
  },
  isUserRole (roles, companyId) {
    let tmpl = Template.instance();
    const userId = Router.current().params.id;

    let userRoles = Roles.getRolesForUser(userId, companyId);
    let hidestRole = tmpl.getHidestRole(userRoles);
    return hidestRole && hidestRole === roles[0] ? 'selected' : '';
  },
  canEditRole() {
    let userId = Meteor.userId();
    let companyId = this._id;
    return !Roles.userIsInRole(userId, ['company-owner', 'company-admin'], companyId);
  },
  canBeAssignedCompanies() {
    let tmpl = Template.instance();
    return tmpl.canBeAssignedCompanies.get();
  },
  isSearchActive() {
    let tmpl = Template.instance();
    let searchString = tmpl.searchString.get();
    return searchString && tmpl.canBeAssignedCompanies.get();
  }
});

Template.companiesRoles.events({
  'change #user-role'(event, tmpl) {
    event.preventDefault();
    const userId = Router.current().params.id;
    let companyId = this._id;
    let role = event.currentTarget.value;
    updateUserCompanyRole.call({userId, companyId, role}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        VZ.notify(message);
      }
    });
  },
  'click #remove-user-from-company'(event, tmpl) {
    event.preventDefault();
    const userId = Router.current().params.id;
    let companyId = this._id;
    removeUserFromCompany.call({userId: userId, companyId: companyId}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        VZ.notify(message);
      }
    });
  },
  'input #search-company': _.debounce(function (event, tmpl) {
    setTimeout(function () {
      let searchString = $(event.currentTarget).val();
      tmpl.searchString.set(searchString);
    },20)
  },100),
  'click .suggestedItemCompany': function(event, tmpl) {
    let selectedCompanyId = this._id;
    const userId = Router.current().params.id;
    addUserToCompany.call({userId: userId, companyId: selectedCompanyId, role: 'Worker'}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        VZ.notify(message);
      }
      else {
        tmpl.$('#search-company').val('');
      }
    });
  },
});