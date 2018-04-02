import {Projects, ProjectSchema} from './projects';
import {Tasks} from '/imports/api/tasks/tasks';
import {VZ} from '/imports/startup/both/namespace';
import {sendNotifications} from '/imports/api/notifications/methods';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {addProjectCreatedMessage} from '/imports/api/activityMessages/methods';
import {projectUserPositions} from '/imports/startup/both/user-positions/project';

export const createProject = new ValidatedMethod({
  name: 'projects.createProject',
  validate: new SimpleSchema({
    project: {
      type: ProjectSchema,
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({ project, userId }) {
    userId = userId || this.userId;

    if (!userId) {
      throw new Meteor.Error('projects.createProject.notLoggedIn',
        'Must be logged in to create projects.');
    }

    if (Projects.find({projectKey: project.projectKey, ownerId: userId}).count() > 0) {
      throw new Meteor.Error('Project key already exist!');
    }
    project.ownerId = userId;
    project.createdAt = new Date();
    project.updatedAt = new Date();
    project.archived = false;
    project.assignedUsersIds = [userId];
    project.info = {};
    project.info.tasksCount = 0;
    project.info.tasksCompleted = 0;
    project.trackingInfo = {};
    project.trackingInfo.allUsers = {};
    project.trackingInfo.individual = [];
    project.trackingInfo.allUsers.allTime = {tracked: 0, earned: 0};
    project.trackingInfo.allUsers.lastMonth = {tracked: 0, earned: 0};
    project.trackingInfo.allUsers.thisMonth = {tracked: 0, earned: 0};
    project.trackingInfo.allUsers.lastWeek = {tracked: 0, earned: 0};
    project.trackingInfo.allUsers.thisWeek = {tracked: 0, earned: 0};
    project.trackingInfo.allUsers.yesterday = {tracked: 0, earned: 0};
    project.trackingInfo.allUsers.today = {tracked: 0, earned: 0};
    project.tasksInfo = {};
    project.tasksInfo.allUsers = {all: 0, completed: 0};
    project.tasksInfo.individual = [];
    const projectId = Projects.insert(project);

    // owner is company admin
    Roles.addUsersToRoles(userId, 'project-owner', projectId);

    let user = Meteor.users.findOne({_id: userId});
    let notificationMsg = 'Project - ' + project.name + ' - added by ' + user.profile.fullName + ' -';
    sendNotifications.call({userId, title: "Project created", msg: notificationMsg, usersIdsArray: [userId]});
    addProjectCreatedMessage.call({userId, status: 'project-created', projectOwner: userId, projectId: projectId});
    return projectId;
  }
});

export const createProjectDesktop = new ValidatedMethod({
  name: 'projects.createProjectDesktop',
  validate: new SimpleSchema({
    project: {
      type: ProjectSchema,
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
    }
  }).validator(),
  run({ project, userId }) {
    const projectId = createProject.call({ project, userId });
    return Projects.findOne({ _id: projectId });
  }
});

export const createProjectAndroidApp = new ValidatedMethod({
  name: 'projects.createProjectAndroidApp',
  validate: new SimpleSchema({
    project: {
      type: ProjectSchema,
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true,
    }
  }).validator(),
  run({ project, userId }) {
    const projectId = createProject.call({ project, userId });
    if(projectId){
      return JSON.stringify(projectId);
    }
    return JSON.stringify(false);
  }
});

export const updateProject = new ValidatedMethod({
  name: 'projects.updateProject',
  validate: new SimpleSchema({
    project: {
      type: ProjectSchema,
    },
    projectKey: {
      type: String
    },
    projectFiles: {
      type: [Object],
      optional: true
    },
    'projectFiles.$.fileName': {
      type: String
    },
    'projectFiles.$.mediaLink': {
      type: String
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),

  run({project, projectKey, projectFiles, userId}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('projects.updateProject.notLoggedIn',
        'Must be logged in to update projects.');
    }
    projectFiles = projectFiles || [];
    if (project.projectKey != projectKey && Projects.find({
        projectKey: projectKey,
        ownerId: currentUserId
      }).count() > 0) {
      throw new Meteor.Error('Project key already exist!');
    }
    else {
      let projectId = project._id;
      if (VZ.canUser('editProject', currentUserId, project._id)) {
        project.projectKey = projectKey;
        project = _.omit(project, '_id');
        Projects.update({_id: projectId}, {$set: project, $addToSet: {projectFiles: {$each: projectFiles}}});
      } else {
        throw new Meteor.Error('projects.updateProject.PermissionError', 'You can\'t edit this project!');
      }
    }
  }
});

export const archiveProject = new ValidatedMethod({
  name: 'projects.archiveProject',
  validate: new SimpleSchema({
    projectId: {type: String},
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({projectId, userId}) {
    const currentUserId = this.userId || userId ;
    if (!currentUserId) {
      throw new Meteor.Error('projects.archiveProject.notLoggedIn',
        'Must be logged in to archive project.');
    }
    if (VZ.canUser('archiveProject', currentUserId, projectId)) {
      let booleanResponse = false;

      let project = Projects.findOne({_id: projectId});
      Projects.update(projectId, {
        $set: {
          archived: true,
          updatedAt: new Date()
        }
      }, {}, function (err, numberAffected) {
        if (err) {
          booleanResponse = false;
        }
        else if (numberAffected === 0) {
          booleanResponse = false;
        }
        else if (numberAffected > 0) {
          booleanResponse = true;
        }
      });
      Tasks.update({projectId: projectId}, {$set: {archived: true, status: 'Closed'}}, {multi: true});
      let user = Meteor.users.findOne({_id: currentUserId});
      let notificationMsg = 'Project - ' + project.name + ' - archived by ' + user.profile.fullName + ' -';
      sendNotifications.call({title: 'Project archived', msg: notificationMsg, usersIdsArray: [currentUserId], userId: currentUserId});
      return JSON.stringify(booleanResponse);
    } else {
      throw new Meteor.Error('projects.archiveProject.permissionError', 'You can\'t archive this project!');
    }
  }
});

export const archiveProjects = new ValidatedMethod({
  name: 'projects.archiveProjects',
  validate: new SimpleSchema({
    projectsIds: {type: [String]},
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({projectsIds, userId}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('projects.archiveProjects.notLoggedIn', 'Must be logged in to archive projects.');
    }
    let booleanResponse = false;
    Projects.update({_id: {$in: projectsIds}}, {
      $set: {
        archived: true,
        updatedAt: new Date()
      }
    }, {multi: true}, function (err, numberAffected) {
      if (err) {
        booleanResponse = false;
      }
      else if (numberAffected === 0) {
        booleanResponse = false;
      }
      else if (numberAffected > 0) {
        booleanResponse = true;
      }
    });
    Tasks.update({projectId: {$in: projectsIds}}, {$set: {archived: true, status: 'Closed'}}, {multi: true});
    return JSON.stringify(booleanResponse);
  }
});

export const restoreProjects = new ValidatedMethod({
  name: 'projects.restoreProjects',
  validate: new SimpleSchema({
    projectsIds: {type: [String]},
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({projectsIds, userId}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('projects.restoreProjects.notLoggedIn',
        'Must be logged in to restore projects.');
    }
    let booleanResponse = false;
    Projects.update({_id: {$in: projectsIds}}, {
      $set: {
        archived: false,
        updatedAt: new Date()
      }
    }, {multi: true}, function (err, numberAffected) {
      if (err) {
        booleanResponse = false;
      }
      else if (numberAffected === 0) {
        booleanResponse = false;
      }
      else if (numberAffected > 0) {
        booleanResponse = true;
      }
    });
    Tasks.update({projectId: {$in: projectsIds}}, {$set: {archived: false, status: 'Opened'}}, {multi: true});
    return JSON.stringify(booleanResponse);
  }
});

export const restoreProject = new ValidatedMethod({
  name: 'projects.restoreProject',
  validate: new SimpleSchema({
    projectId: {type: String},
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({projectId, userId}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('projects.restoreProject.notLoggedIn',
        'Must be logged in to restore project.');
    }

    if (VZ.canUser('restoreProject', currentUserId, projectId)) {
      let booleanResponse = false;
      const project = Projects.findOne({_id: projectId});
      Projects.update({_id: projectId}, {
        $set: {
          archived: false,
          updatedAt: new Date()
        }
      }, {}, function (err, numberAffected) {
        if (err) {
          booleanResponse = false;
        }
        else if (numberAffected === 0) {
          booleanResponse = false;
        }
        else if (numberAffected > 0) {
          booleanResponse = true;
        }
      });
      Tasks.update({projectId: projectId}, {$set: {archived: false, status: 'Opened'}}, {multi: true});
      let user = Meteor.users.findOne({_id: currentUserId});
      let notificationMsg = "Project - " + project.name + " - restored by " + user.profile.fullName + " -";
      sendNotifications.call({title: "Project restored", msg: notificationMsg, usersIdsArray: [currentUserId], userId: currentUserId});
      return JSON.stringify(booleanResponse);
    } else {
      throw new Meteor.Error('projects.restoreProjects.permissionError', 'You can\'t restore this project!');
    }
  }
});

export const deleteProjectFile = new ValidatedMethod({
  name: 'projects.deleteProjectFile',
  validate: new SimpleSchema({
    projectId: {type: String},
    fileName: {type: String}
  }).validator(),
  run({projectId, fileName}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('projects.deleteProjectFile.notLoggedIn',
        'Must be logged in.');
    }
    if (VZ.canUser('editProject', userId, projectId)) {
      Projects.update(projectId, {$pull: {projectFiles: {fileName: fileName}}});
    } else {
      throw new Meteor.Error('projects.updateProject.PermissionError', 'You can\'t delete this project files!');
    }
  }
});

export const getProjectById = new ValidatedMethod({
  name: 'projects.getProjectById',
  validate: new SimpleSchema({
    projectId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({projectId}) {
    let project = Projects.findOne({_id: projectId});
    return JSON.stringify(project);
  }
});

export const addUserToProject = new ValidatedMethod({
  name: 'projects.addUserToProject',
  validate: new SimpleSchema({
    userId: {type: String},
    projectId: {type: String},
    role: {type: String}
  }).validator(),
  run({userId, projectId, role}) {
    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('projects.addUserToProject.notLoggedIn',
        'Must be logged in.');
    }
    let project = Projects.findOne({_id: projectId});
    if(project.ownerId !== currentUserId){
      if (!VZ.canUser('assignUserToProject', currentUserId, projectId)) {
        throw new Meteor.Error('permission-error', 'You don\'t have permissions for this');
      }
    }
    else {
      let selectedRoles = _.filter(projectUserPositions, (position) => {
        return position.name === role;
      });
      let roles = selectedRoles[0].roles;
      let userRoles = Roles.getRolesForUser(userId, projectId);
      Roles.removeUsersFromRoles(userId, userRoles, projectId);
      Projects.update(projectId, {$set: {updatedAt: new Date()}, $addToSet: {assignedUsersIds: userId}});
      Roles.addUsersToRoles(userId, roles, projectId);
    }
  }
});

export const removeUserFromProject = new ValidatedMethod({
  name: 'projects.removeUserFromProject',
  validate: new SimpleSchema({
    userId: {type: String},
    projectId: {type: String}
  }).validator(),
  run({userId, projectId}) {
    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('projects.removeUserFromProject.notLoggedIn',
        'Must be logged in.');
    }
    if (!VZ.canUser('assignUserToProject', currentUserId, projectId)) {
      throw new Meteor.Error('permission-error', 'Only project owner can remove users');
    }
    else {
      let userTaskAssigned = Tasks.find({projectId: projectId, membersIds: userId}).fetch();
      let project = Projects.findOne({_id: projectId});
      for (let i = 0; i < userTaskAssigned.length; i++) {
        if (Roles.userIsInRole(userId, ['task-member'], userTaskAssigned[i]._id)) {
          Roles.removeUsersFromRoles(userId, 'task-member', userTaskAssigned[i]._id);
        }
      }

      let userRoles = Roles.getRolesForUser(userId, projectId);
      Roles.removeUsersFromRoles(userId, userRoles, projectId);

      Projects.update(projectId, {$set: {updatedAt: new Date()}, $pull: {assignedUsersIds: userId}});
      Tasks.update({projectId: projectId, membersIds: userId}, {
        $set: {updatedAt: new Date()},
        $pull: {membersIds: userId}
      }, {multi: true});
    }
  }
});

export const updateUserRole = new ValidatedMethod({
  name: 'projects.updateUserRole',
  validate: new SimpleSchema({
    userId: {type: String},
    projectId: {type: String},
    role: {type: String}
  }).validator(),
  run({userId, projectId, role}) {
    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('projects.updateUserRole.notLoggedIn',
        'Must be logged in.');
    }
    if (!VZ.canUser('assignUserToProject', currentUserId, projectId)) {
      throw new Meteor.Error('permission-error', 'Only project owner can assign users');
    }
    else {
      let project = Projects.findOne({_id: projectId});
      if (project.ownerId === userId) {
        throw new Meteor.Error('permission-error', 'Can\'t change role of main project owner');
      }
      else {
        let selectedRoles = _.filter(projectUserPositions, (position) => {
          return position.name === role;
        });
        let roles = selectedRoles[0].roles;
        let userRoles = Roles.getRolesForUser(userId, projectId);
        Roles.removeUsersFromRoles(userId, userRoles, projectId);
        Roles.addUsersToRoles(userId, roles, projectId);
      }
    }
  }
});

export const updateProjectTime = new ValidatedMethod({
  name: 'projects.updateProjectTime',
  validate: new SimpleSchema({
    projectId: {type: String}
  }).validator(),
  run({projectId}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('projects.updateProjectTime.notLoggedIn',
        'Must be logged in.');
    }
    Projects.update(projectId, {$set: {updatedAt: new Date()}});
  }
});
