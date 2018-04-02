import './project-roles.html';
import {Roles} from 'meteor/alanning:roles';
import {Projects} from '/imports/api/projects/projects';
import {projectUserPositions} from '/imports/startup/both/user-positions/project';
import { VZ } from '/imports/startup/both/namespace';
import { addUserToProject, removeUserFromProject, updateUserRole } from '/imports/api/projects/methods';


Template.projectRoles.onCreated(function () {
  this.assignedProjects = new ReactiveVar([]);
  this.canBeAssignedProjects = new ReactiveVar([]);
  this.searchString = new ReactiveVar('');

  this.getHidestRole = (userRoles) => {
    let ownerIndex = _.indexOf(userRoles, 'project-owner');
    let adminIndex = _.indexOf(userRoles, 'project-admin');
    let managerIndex = _.indexOf(userRoles, 'project-manager');
    let workerIndex = _.indexOf(userRoles, 'project-worker');
    let observerIndex = _.indexOf(userRoles, 'project-observer');

    if(ownerIndex != -1){
      return 'project-owner';
    }
    else if(adminIndex != -1){
      return 'project-admin';
    }
    else if(managerIndex != -1){
      return 'project-manager';
    }
    else if(workerIndex != -1){
      return 'project-worker';
    }
    else if(observerIndex != -1){
      return 'project-observer';
    }
    else {
      return '';
    }
  };

  this.autorun(() => {
    const userId = Router.current().params.id;

    let sub = this.subscribe('roles.assignedProjects', userId);
    if (sub.ready()) {
      let projectsCreatedByUser = Roles.getGroupsForUser(userId, 'project-owner');
      let projectsWhereUserAdmin = Roles.getGroupsForUser(userId, 'project-admin');
      let projectsWhereUserManager = Roles.getGroupsForUser(userId, 'project-manager');
      let projectsWhereUserWorker = Roles.getGroupsForUser(userId, 'project-worker');
      let projectsWhereUserObserver = Roles.getGroupsForUser(userId, 'project-observer');
      let relatedProjectsDirectly = _.union(projectsCreatedByUser, projectsWhereUserAdmin, projectsWhereUserManager, projectsWhereUserWorker, projectsWhereUserObserver);

      let relatedProjects = Projects.find({_id: {$in: relatedProjectsDirectly}, archived: false}).fetch();
      this.assignedProjects.set(relatedProjects);
    }
  });

  this.autorun(() => {
    const userId = Meteor.userId();
    let projectsCreatedByUser = Roles.getGroupsForUser(userId, 'project-owner');
    let projectsWhereUserAdmin = Roles.getGroupsForUser(userId, 'project-admin');
    let relatedProjectsDirectly = _.union(projectsCreatedByUser, projectsWhereUserAdmin);
    let searchString = this.searchString.get();
    let assignedProjects = _.clone(this.assignedProjects.get());
    let assignedProjectsIds = assignedProjects.map((project) => {
      return project._id;
    });
    let projectIds = _.difference(relatedProjectsDirectly, assignedProjectsIds);
    let query = {_id: {$in: projectIds}, archived: false};
    if(searchString){
      let regex = new RegExp(searchString, 'gi');
      query.name = {$regex: regex};
    }
    let sub = this.subscribe('roles.canBeAssignedProjects', assignedProjectsIds, searchString);
    if (sub.ready()) {
      let relatedProjects = Projects.find(query).fetch();
      this.canBeAssignedProjects.set(relatedProjects);
    }
  });
});
Template.projectRoles.onRendered(function () {
  this.autorun(() => {
    this.assignedProjects.get();
    setTimeout(() => {
      this.$('select').material_select();
    }, 700);
  });
});

Template.projectRoles.helpers({
  assignedProjects() {
    let tmpl = Template.instance();
    let assignedProjects = _.clone(tmpl.assignedProjects.get());
    return assignedProjects;
  },
  projectUserPositions() {
    return projectUserPositions;
  },
  isUserRole (roles, projectId) {
    let tmpl = Template.instance();
    const userId = Router.current().params.id;

    let userRoles = Roles.getRolesForUser(userId, projectId);
    let hidestRole = tmpl.getHidestRole(userRoles);
    return hidestRole && hidestRole === roles[0] ? 'selected' : '';
  },
  canEditRole() {
    let userId = Meteor.userId();
    let projectId = this._id;
    return !Roles.userIsInRole(userId, ['project-owner', 'project-admin'], projectId);
  },
  canBeAssignedProjects() {
    let tmpl = Template.instance();
    return tmpl.canBeAssignedProjects.get();
  },
  isSearchActive() {
    let tmpl = Template.instance();
    let searchString = tmpl.searchString.get();
    return searchString && tmpl.canBeAssignedProjects.get();
  }
});

Template.projectRoles.events({
  'change #user-role'(event, tmpl) {
    event.preventDefault();
    const userId = Router.current().params.id;
    let projectId = this._id;
    let role = event.currentTarget.value;
    updateUserRole.call({userId, projectId, role}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        VZ.notify(message);
      }
    });
  },
  'click #remove-user-from-project'(event, tmpl) {
    event.preventDefault();
    const userId = Router.current().params.id;
    let projectId = this._id;
    removeUserFromProject.call({userId: userId, projectId: projectId}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        VZ.notify(message);
      }
    });
  },
  'input #search-project': _.debounce(function (event, tmpl) {
    setTimeout(function () {
      let searchString = $(event.currentTarget).val();
      tmpl.searchString.set(searchString);
    },20)
  },100),
  'click .suggestedItemProject': function(event, tmpl) {
    let selectedProjectId = this._id;
    const userId = Router.current().params.id;
    addUserToProject.call({userId: userId, projectId: selectedProjectId, role: 'Worker'}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        VZ.notify(message);
      }
      else {
        tmpl.$('#search-project').val('');
      }
    });
  },
});