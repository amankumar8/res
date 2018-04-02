import './user-roles.html';
import {Roles} from 'meteor/alanning:roles';

Template.userRoles.onCreated(function () {
  this.assignedCompanies = new ReactiveVar([]);
  this.canBeAssignedCompanies = new ReactiveVar([]);

  this.autorun(() => {
    this.subscribe('allRoles');
  });
});

Template.userRoles.helpers({
});