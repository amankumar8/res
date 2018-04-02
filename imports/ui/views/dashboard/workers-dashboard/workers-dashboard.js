import './workers-dashboard.html';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

Template.workersDashboard.helpers({
  companyOwner(){
    let user = Meteor.user();
    let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
    return Roles.userIsInRole(user._id, ['company-owner'], selectedCompanyId);
  },
  companyOwnerOrAdmin(){
    let user = Meteor.user();
    let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
    return Roles.userIsInRole(user._id, ['company-owner', 'company-admin'], selectedCompanyId);
  },
  companyOwnerOrAdminOrManager(){
    let user = Meteor.user();
    let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
    return Roles.userIsInRole(user._id, ['company-owner', 'company-admin', 'company-manager'], selectedCompanyId);
  }
});