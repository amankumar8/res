import {VZ} from '/imports/startup/both/namespace';
import {assignMembersToTeam} from '/imports/api/teams/methods';
import {assignUsersToCompany} from '/imports/api/companies/methods';

import './assign-user-modal/assign-user-modal';
import './assigned-user-item/assigned-user-item';
import './assigning-users.html';

Template.assigningUsers.onCreated(function () {
  let self = this;

  this.shouldDisplayAssignUsersInput = new ReactiveVar(false);
  this.assignedUsers = new ReactiveArray([]);
  let userPositions = this.data.params.userPositions;

  let getUserWithPositions = function (userId, userPosition) {
    let targetEntityId = self.data.targetEntity._id;
    let userRoles = Roles.getRolesForUser(userId, targetEntityId);
    // because, getRoles for user return global roles too, so I need only that roles, that
    // exist in positions for this entity
    let rolesFromAllPositions = [];
    userPositions.forEach(function (userPosition) {
      rolesFromAllPositions = _.union(rolesFromAllPositions, userPosition.roles);
    });
    userRoles = _.intersection(userRoles, rolesFromAllPositions);

    let assignedUsers = self.assignedUsers.array();
    let assignedUser = _.find(assignedUsers, function (assignedUser) {
      return assignedUser._id == userId;
    });
    if (!assignedUser) {
      assignedUser = {
        _id: userId,
        positions: []
      }
    }

    let symmetricDiff = _.union(_.difference(userRoles, userPosition.roles),
      _.difference(userPosition.roles, userRoles));
    if (symmetricDiff.length == 0) {
      assignedUser.positions.push(userPosition);
    }
    return assignedUser;
  };
  if (self.data && self.data.targetEntity) {

    userPositions.forEach(function (userPosition) {
      let users = self.data.targetEntity[userPosition.propertyNameInCollection] || [];
      users.forEach(function (user) {
        let userId = _.isObject(user) ? user.id || user._id : user;
        let assignedUser = getUserWithPositions(userId, userPosition);
        self.assignedUsers.remove(function (user) {
          return user._id == userId;
        });
        self.assignedUsers.push(assignedUser);
      });
    });
  }

  this.assignedUsersBeforeChanges = self.assignedUsers.array();

  this.openAssignUserModal = function (userId, assignedToUserPositions) {
    let user = Meteor.users.findOne({_id: Meteor.userId()});
    let selectedCompanyId = user.profile && user.profile.selectedCompanyId;
    let allAvailableUsersPositions = self.data.params.userPositions;
    let routerName = Router.current().route.getName();

    let modalData = {
      onAssignUser: function (userWithPositions) {
        self.assignedUsers.remove(function (assignedUser) {
          return assignedUser._id == userWithPositions._id;
        });
        self.assignedUsers.push(userWithPositions);
        self.shouldDisplayAssignUsersInput.set(false);
      },
      userId: userId,

      // all user position that available for current entity, like
      // manager(['company-worker', 'company-manager']), worker(['company-worker'])
      userPositions: allAvailableUsersPositions,
      assignedToUserPositions: assignedToUserPositions
    };
    let owner = '';
    let admin = '';
    let manager = '';

    let parentNode = $('body')[0];
    if (routerName === 'assignUsersToCompany') {
      owner = 'company-owner';
      admin = 'company-admin';
      manager = 'company-manager';
    }
    else if(routerName === 'assignUsersToProject') {
      owner = 'project-owner';
      admin = 'project-admin';
      manager = 'project-manager';
    }

    if(selectedCompanyId){
      if (Roles.userIsInRole(Meteor.userId(), admin, Router.current().params.id)) {
        modalData.userPositions = _.filter(userPositions, (position) => {
          return position.name === 'Admin' || position.name === 'Manager' || position.name === 'Worker' || position.name === 'Observer';
        });
      }
      else if (Roles.userIsInRole(Meteor.userId(), manager, Router.current().params.id)) {
        modalData.userPositions = _.filter(userPositions, (position) => {
          return position.name === 'Worker';
        });
      }
    }
    else if(!selectedCompanyId){
      if (Roles.userIsInRole(Meteor.userId(), owner, Router.current().params.id)) {
        modalData.userPositions = _.filter(userPositions, (position) => {
          return position.name === 'Manager' || position.name === 'Observer';
        });
      }
      else if (Roles.userIsInRole(Meteor.userId(), manager, Router.current().params.id)) {
        modalData.userPositions = _.filter(userPositions, (position) => {
          return position.name === 'Worker' || position.name === 'Observer';
        });
      }
    }

    Blaze.renderWithData(Template.assignUserModal, modalData, parentNode);
  };

  this.goBack = function () {
    let backwardRoute = self.data.params.backwardRoute;
    Router.go(backwardRoute.route, backwardRoute.params);
  };

  this.autorun(() => {
    // subscribe on assignedUsers
    let alreadyAssignedUsers = this.assignedUsers.list();
    let alreadyAssignedUsersIds = _.map(alreadyAssignedUsers, function (user) {
      return user._id;
    });
    this.subscribe('assignedUsers', alreadyAssignedUsersIds);
  });
});

Template.assigningUsers.helpers({
  assignedUsers() {
    return Template.instance().assignedUsers.list();
  },

  shouldDisplayAssignUsersInput() {
    return Template.instance().shouldDisplayAssignUsersInput.get();
  },

  assignUserCb() {
    let tmpl = Template.instance();
    return function (userId) {
      tmpl.openAssignUserModal(userId);
    };
  },

  onChangeRolesCb() {
    let tmpl = Template.instance();
    return function (userId, userPositions) {
      tmpl.openAssignUserModal(userId, userPositions);
    }
  },

  onRemoveUserCb() {
    let tmpl = Template.instance();

    return function (userId) {
      tmpl.assignedUsers.remove(function (userToRemove) {
        return userToRemove._id == userId;
      });
    }
  },

  changesWereMade() {
    let tmpl = Template.instance();
    let assignedUsersBefore = tmpl.assignedUsersBeforeChanges.slice(0);
    let assignedUsersNow = tmpl.assignedUsers.list().array();

    if (assignedUsersBefore.length != assignedUsersNow.length) {
      return true;
    }

    let notChangedUsers = [];
    assignedUsersBefore.forEach(function (userBefore) {
      let notChangedUser = _.find(assignedUsersNow, function (userNow) {
        return _.isEqual(userNow, userBefore);
      });
      if (!!notChangedUser) {
        notChangedUsers.push(notChangedUser);
      }
    });
    return notChangedUsers.length != assignedUsersBefore.length;
  },

  excludedUsersIds() {
    let ids = Template.instance().assignedUsers.list().array().map(function (user) {
      return user._id;
    });
    ids.push(Meteor.userId());
    ids.push(this.targetEntity.ownerId);

    return ids;
  }
});

Template.assigningUsers.events({
  'click .show-assignUser-input-icon': function (event, tmpl) {
    tmpl.shouldDisplayAssignUsersInput.set(true);
  },

  'click .add-assignedUser-icon': function (event, tmpl) {
    tmpl.shouldDisplayAssignUsersInput.set(false);
  },

  'click .remove-user-icon': function (event, tmpl) {
    tmpl.shouldDisplayAssignUsersInput.set(false);
  },

  'click .cancel-add-assignedUser-icon': function (event, tmpl) {
    tmpl.shouldDisplayAssignUsersInput.set(false);
  },

  'submit #assignUserToEntityForm': function (event, tmpl) {
    event.preventDefault();
    const methodName = tmpl.data.params.methodForAssignUsersToEntityName;
    const targetEntityId = tmpl.data && tmpl.data.targetEntity && tmpl.data.targetEntity._id;

    let assignedUsers = tmpl.assignedUsers.array();
    if (methodName === 'assignMembersToTeam') {
      assignMembersToTeam.call({
        teamId: targetEntityId,
        assignedUsersWithPositions: assignedUsers,
        assignedUsersWithPositionsBeforeChanges: tmpl.assignedUsersBeforeChanges
      }, function (err, res) {
        if (err) {
          console.log(err);
          VZ.notify("Failed to assign user, try again");
        } else {
          tmpl.goBack();
        }
      });
    }
    else {
      assignUsersToCompany.call({
        companyId: targetEntityId,
        assignedUsersWithPositions: assignedUsers,
        assignedUsersWithPositionsBeforeChanges: tmpl.assignedUsersBeforeChanges
      }, function (err, res) {
        if (err) {
          console.log(err.message);
          VZ.notify("Failed to assign user, try again");
        } else {
          tmpl.goBack();
        }
      });
    }
  },

  'click .cancel-button': function (event, tmpl) {
    event.preventDefault();
    tmpl.goBack();
  }
});
