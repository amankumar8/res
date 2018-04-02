import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import { VZ } from '/imports/startup/both/namespace';
import {Companies} from '/imports/api/companies/companies';
import {companyUserPositions} from '/imports/startup/both/user-positions/company';

export const updateUserCompanyRole = new ValidatedMethod({
  name: 'companies.updateUserCompanyRole',
  validate: new SimpleSchema({
    userId: {type: String},
    companyId: {type: String},
    role: {type: String}
  }).validator(),
  run({userId, companyId, role}) {
    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('companies.updateUserCompanyRole.notLoggedIn',
        'Must be logged in.');
    }
    if (!VZ.canUser('assignUsersToCompany', currentUserId, companyId)) {
      throw new Meteor.Error('permission-error', 'Only company owner can assign users');
    }
    else {
      let company = Companies.findOne({_id: companyId});
      if (company.ownerId === userId) {
        throw new Meteor.Error('permission-error', 'Can\'t change role of main project owner');
      }
      else {
        let selectedRoles = _.filter(companyUserPositions, (position) => {
          return position.name === role;
        });
        let roles = selectedRoles[0].roles;
        let userRoles = Roles.getRolesForUser(userId, companyId);
        Roles.removeUsersFromRoles(userId, userRoles, companyId);
        Roles.addUsersToRoles(userId, roles, companyId);
      }
    }
  }
});

export const removeUserFromCompany = new ValidatedMethod({
  name: 'companies.removeUserFromCompany',
  validate: new SimpleSchema({
    userId: {type: String},
    companyId: {type: String}
  }).validator(),
  run({userId, companyId}) {
    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('companies.removeUserFromCompany.notLoggedIn',  'Must be logged in.');
    }
    if (!VZ.canUser('assignUsersToCompany', currentUserId, companyId)) {
      throw new Meteor.Error('permission-error', 'Only company owner can remove users');
    }
    else {
      Companies.update({_id: companyId}, {$pull: {workersIds: userId}});
      Roles.removeUsersFromRoles(userId, ['company-owner', 'company-admin', 'company-manager', 'company-worker', 'company-observer'], companyId);
    }
  }
});

export const addUserToCompany = new ValidatedMethod({
  name: 'companies.addUserToCompany',
  validate: new SimpleSchema({
    userId: {type: String},
    companyId: {type: String},
    role: {type: String}
  }).validator(),
  run({userId, companyId, role}) {
    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('companies.addUserToCompany.notLoggedIn', 'Must be logged in.');
    }
    let company = Companies.findOne({_id: companyId});
    if(company.ownerId !== currentUserId){
      if (!VZ.canUser('assignUsersToCompany', currentUserId, companyId)) {
        throw new Meteor.Error('permission-error', 'You don\'t have permissions for this');
      }
    }
    else {
      let selectedRoles = _.filter(companyUserPositions, (position) => {
        return position.name === role;
      });
      let roles = selectedRoles[0].roles;
      Companies.update({_id: companyId}, {$set: {updatedAt: new Date()}, $addToSet: {workersIds: userId}});
      Roles.addUsersToRoles(userId, roles, companyId);
    }
  }
});