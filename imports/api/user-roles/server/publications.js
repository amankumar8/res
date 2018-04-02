import {Meteor} from 'meteor/meteor';
import {publishComposite} from 'meteor/reywood:publish-composite';
import {Companies} from '/imports/api/companies/companies';
import {Projects} from '/imports/api/projects/projects';

Meteor.publish('allRoles', function () {
  return Roles.getAllRoles();
});

publishComposite('roles.assignedCompanies', function (userId) {
  const currentUserId = this.userId;
  if(!currentUserId){
    return this.ready();
  }
  return {
    find: function () {
        return Meteor.users.find({_id: userId});
    },
    children: [
      {
        find: function (user) {
          let companiesCreatedByUser = Roles.getGroupsForUser(user._id, 'company-owner');
          let companiesWhereUserAdmin = Roles.getGroupsForUser(user._id, 'company-admin');
          let companiesWhereUserManager = Roles.getGroupsForUser(user._id, 'company-manager');
          let companiesWhereUserWorker = Roles.getGroupsForUser(user._id, 'company-worker');
          let companiesWhereUserObserver = Roles.getGroupsForUser(user._id, 'company-observer');
          let relatedCompaniesDirectly = _.union(companiesCreatedByUser,
            companiesWhereUserAdmin,
            companiesWhereUserManager,
            companiesWhereUserWorker,
            companiesWhereUserObserver);

          return Companies.find({_id: {$in: relatedCompaniesDirectly}, isArchived: false});
        }
      }
    ]
  }
});

publishComposite('roles.canBeAssignedCompanies', function (assignedCompaniesIds, searchString) {
  const userId = this.userId;
  if(!userId){
    return this.ready();
  }
  return {
    find: function () {
      return Meteor.users.find({_id: userId});
    },
    children: [
      {
        find: function (user) {
          let companiesCreatedByUser = Roles.getGroupsForUser(user._id, 'company-owner');
          let companiesWhereUserAdmin = Roles.getGroupsForUser(user._id, 'company-admin');

          let relatedCompaniesDirectly = _.union(companiesCreatedByUser, companiesWhereUserAdmin);
          let companiesIds = _.difference(relatedCompaniesDirectly, assignedCompaniesIds);
          let query = {_id: {$in: companiesIds}, isArchived: false};
          if(searchString) {
            let regex = new RegExp(searchString, 'gi');
            query.name = {$regex: regex};
          }
          return Companies.find(query);
        }
      }
    ]
  }
});

publishComposite('roles.assignedProjects', function (userId) {
  const currentUserId = this.userId;
  if(!currentUserId){
    return this.ready();
  }
  return {
    find: function () {
      return Meteor.users.find({_id: userId});
    },
    children: [
      {
        find: function (user) {
          let projectsCreatedByUser = Roles.getGroupsForUser(user._id, 'project-owner');
          let projectsWhereUserAdmin = Roles.getGroupsForUser(user._id, 'project-admin');
          let projectsWhereUserManager = Roles.getGroupsForUser(user._id, 'project-manager');
          let projectsWhereUserWorker = Roles.getGroupsForUser(user._id, 'project-worker');
          let projectsWhereUserObserver = Roles.getGroupsForUser(user._id, 'project-observer');
          let relatedProjectsDirectly = _.union(projectsCreatedByUser, projectsWhereUserAdmin, projectsWhereUserManager, projectsWhereUserWorker, projectsWhereUserObserver);

          return Projects.find({_id: {$in: relatedProjectsDirectly}, archived: false});
        }
      }
    ]
  }
});

publishComposite('roles.canBeAssignedProjects', function (assignedProjectsIds, searchString) {
  const userId = this.userId;
  if(!userId){
    return this.ready();
  }
  return {
    find: function () {
      return Meteor.users.find({_id: userId});
    },
    children: [
      {
        find: function (user) {
          let projectsCreatedByUser = Roles.getGroupsForUser(user._id, 'project-owner');
          let projectsWhereUserAdmin = Roles.getGroupsForUser(user._id, 'project-admin');

          let relatedProjectsDirectly = _.union(projectsCreatedByUser, projectsWhereUserAdmin);
          let projectsIds = _.difference(relatedProjectsDirectly, assignedProjectsIds);
          let query = {_id: {$in: projectsIds}, archived: false};
          if(searchString) {
            let regex = new RegExp(searchString, 'gi');
            query.name = {$regex: regex};
          }
          return Projects.find(query);
        }
      }
    ]
  }
});

publishComposite('roles.usersList', function () {
  const currentUserId = this.userId;
  if(!currentUserId){
    return this.ready();
  }
  return {
    find: function () {
      return Meteor.users.find({_id: currentUserId});
    },
    children: [
      {
        find: function (user) {
          let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
          let users = Roles.getUsersInRole(['company-owner', 'company-admin', 'company-manager', 'company-worker', 'company-worker'], selectedCompanyId);
          return users;
        }
      }
    ]
  }
});