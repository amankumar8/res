import { VZ } from '/imports/startup/both/namespace';
import { Projects } from '/imports/api/projects/projects';
import { Contracts } from '/imports/api/contracts/contracts';
import { addUserToProject, removeUserFromProject, updateUserRole } from '/imports/api/projects/methods';
import {projectUserPositions} from '/imports/startup/both/user-positions/project';

import './assign-users-to-project-modal.html';

Template.assignUsersToProjectModal.onCreated(function () {
    this.assignedToTaskUsersIds = new ReactiveVar([]);
    this.canBeAssignedUsersIds = new ReactiveVar([]);
    this.searchString = new ReactiveVar('');
    this.stateChanged = new ReactiveVar(false);

    this.setTaskUsers = (projectId) => {
        let project = Projects.findOne({_id: projectId});
        let assignedUsersIds = project && project.assignedUsersIds || [];
        let ownerId = project && project.ownerId;
        let users = {};
        let ownerContracts = Contracts.find({employerId: ownerId}).fetch();
        let contractedUsersIds = _.map(ownerContracts, function (contract) {
            return contract.workerId;
        });

      contractedUsersIds.push(ownerId);
        let canBeAssignedIds = _.difference(contractedUsersIds, assignedUsersIds);
        users.assignedToTaskUsersIds = assignedUsersIds;
        users.canBeAssignedUsersIds = canBeAssignedIds || [];

        this.assignedToTaskUsersIds.set(users.assignedToTaskUsersIds);
        this.canBeAssignedUsersIds.set(users.canBeAssignedUsersIds);
    };

    this.autorun(() => {
        let data = Template.currentData();
        let projectId = data.projectId;
        this.setTaskUsers(projectId);
    });

    this.autorun(() => {
        this.assignedToTaskUsersIds.get();
        this.canBeAssignedUsersIds.get();
    });
});
Template.assignUsersToProjectModal.onRendered(function () {
    let self = this;

    this.$('.modal').modal();
    this.$('.modal').modal('open');
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
    this.autorun(() => {
        this.assignedToTaskUsersIds.get();
        this.canBeAssignedUsersIds.get();
    });
  this.autorun(() => {
    this.stateChanged.get();
    this.$('select').material_select();
  });
});
Template.assignUsersToProjectModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.assignUsersToProjectModal.helpers({
    assignedUsers() {
        let assignedToTaskUsersIds = Template.instance().assignedToTaskUsersIds.get();
        let canBeAssignedUsersIds = Template.instance().canBeAssignedUsersIds.get();
        let searchString = Template.instance().searchString.get();
        let regex = new RegExp(searchString, 'gi');

        let assignedToTaskUsers = Meteor.users.find({
            _id: {$in: assignedToTaskUsersIds},
            $or: [{'profile.fullName': {$regex: regex}}, {'emails.address': {$regex: regex}}]
        }, {fields: {profile: 1, emails: 1}}).fetch();

        let canBeAssignedUsers = Meteor.users.find({
            _id: {$in: canBeAssignedUsersIds},
            $or: [{'profile.fullName': {$regex: regex}}, {'emails.address': {$regex: regex}}]
        }, {fields: {profile: 1, emails: 1}}).fetch();
        return {assignedToTaskUsers: assignedToTaskUsers, canBeAssignedUsers: canBeAssignedUsers};
    },
  projectUserPositions () {
      let projectUserPositionsClone = _.clone(projectUserPositions);
      if(Roles.userIsInRole(Meteor.userId(), 'project-owner', Router.current().params.id)){
        return projectUserPositionsClone;

      }
      else {
        projectUserPositionsClone = _.reject(projectUserPositionsClone, (position) => {
            return position.name === 'Owner'
        });
        return projectUserPositionsClone;
      }
  },
  isUserRole (roles, userId) {
      let userRoles = Roles.getRolesForUser(userId, Router.current().params.id);
      return userRoles && userRoles[0] === roles[0] ? 'selected' : '';
  },
  mainOwner (){
      let data = Template.instance().data;
      let projectId = data.projectId;
      let userId = this._id;
      let project = Projects.findOne({_id: projectId});

      return project && project.ownerId === userId;
  },
  ownRole () {
    return this._id === Meteor.userId();
  },
  currentUserRole () {
    let roles = _.clone(projectUserPositions);
    let data = Template.instance().data;
    let projectId = data.projectId;
    let userRoles = Roles.getRolesForUser(Meteor.userId(), projectId);
    let userRole = userRoles[0];
    if(userRole){
      let currentRole = _.filter(roles, (role) => {
        return role.roles[0] === userRole;
        });
      return currentRole[0] && currentRole[0].name || '';
    }
    return '';
  }
});

Template.assignUsersToProjectModal.events({
    'click #remove-user-from-project'(event, tmpl) {
        let selectedUserId = this._id;
        let projectId = tmpl.data.projectId;
        let assignedToTaskUsersIds = _.clone(tmpl.assignedToTaskUsersIds.get());

        removeUserFromProject.call({userId:selectedUserId, projectId:projectId}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                VZ.notify(message);
            } else {
                assignedToTaskUsersIds = _.reject(assignedToTaskUsersIds, function (userId) {
                    return userId == selectedUserId;
                });
                tmpl.assignedToTaskUsersIds.set(assignedToTaskUsersIds);
                tmpl.stateChanged.set(!tmpl.stateChanged.get());
            }
        });
    },
    'click #add-user-to-project'(event, tmpl) {
        let selectedUserId = this._id;
        let projectId = tmpl.data.projectId;
        let canBeAssignedUsersIds = _.clone(tmpl.canBeAssignedUsersIds.get());
        let role = tmpl.$('#user-role').val();
        let project = Projects.findOne({_id: projectId});

        if (project.ownerId === Meteor.userId() && Meteor.userId() === selectedUserId){
          role = 'Owner'
        }
        else{
          role = 'Worker'
        }

        addUserToProject.call({userId:selectedUserId, projectId:projectId, role:role}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                VZ.notify(message);
            } else {
                canBeAssignedUsersIds = _.reject(canBeAssignedUsersIds, function (userId) {
                    return userId == selectedUserId;
                });
                tmpl.canBeAssignedUsersIds.set(canBeAssignedUsersIds);
                tmpl.stateChanged.set(!tmpl.stateChanged.get());
            }
        });
    },
    'input #search-string': _.debounce(function (event, tmpl) {
        setTimeout(function () {
            let searchString = $(event.currentTarget).val();
            tmpl.searchString.set(searchString);
        },20)
    },100),
    'change #user-role'(event, tmpl) {
      event.preventDefault();
      let projectId = Router.current().params.id;
      let userId = this._id;
      let role = event.currentTarget.value;

      updateUserRole.call({userId, projectId, role}, (err, res) => {
        if (err) {
          let message = err.reason || err.message;
          VZ.notify(message);
        }
      });
    }
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};