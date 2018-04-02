import {Projects} from  '/imports/api/projects/projects';
import {Tasks} from './tasks';
import {VZ} from '/imports/startup/both/namespace';
import {sendNotifications} from '/imports/api/notifications/methods';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {TaskSchema} from './tasks';
import {_addNewTask, _addCompleteTask, _addUsersToTask, _removeUsersFromTask} from '/imports/api/tasksCountCalculations'
import {fillAssignedUsersMap, changeUserRoles} from '/imports/api/users/helper-functions';
import {Contracts} from '/imports/api/contracts/contracts';

export const createTask = new ValidatedMethod({
  name: 'tasks.createTask',
  validate: new SimpleSchema({
    task: {
      type: new SimpleSchema({
        name: {
          type: String,
          min: 3,
          max: 50
        },
        description: {
          type: String,
          // min: 5,
          max: 5000,
          optional: true
        },
        projectId: {
          type: String
        },
        membersIds: {
          type: [String],
          regEx: SimpleSchema.RegEx.Id,
          optional: true
        },
        taskFiles: {
          type: [Object],
          optional: true
        },
        'taskFiles.$.fileName': {
          type: String,
          optional: true
        },
        'taskFiles.$.mediaLink': {
          type: String
        },
        'taskFiles.$.size': {
          type: Number,
          optional: true
        },
        'taskFiles.$.uploaded': {
          type: Date
        },
        'taskFiles.$.type': {
          type: String,
          optional: true
        },
        hardLimit: {
          type: Number,
          optional: true
        }
      })
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true,
    }
  }).validator(),
  run({task, userId}) {
    userId = userId || this.userId;
    if (!userId) {
      throw new Meteor.Error('tasks.createTask.notLoggedIn',
        'Must be logged in.');
    }

    let projectToAssign = Projects.findOne({_id: task.projectId});
    let currentProjectTasksCount = Tasks.find({projectId: task.projectId}).count() + 1;
    let currentProjectKey = projectToAssign.projectKey;
    let taskKey = currentProjectKey + '-' + currentProjectTasksCount;

    _.extend(task, {
      status: 'Opened',
      archived: false,
      taskKey: taskKey,
      ownerId: userId,
      createdAt: new Date(),
      editedAt: new Date(),
      editedBy: userId,
      hardLimit: 0
    });

    task.trackingInfo = {};
    task.trackingInfo.allUsers = {};
    task.trackingInfo.individual = [];
    task.trackingInfo.allUsers.allTime = {tracked: 0, earned: 0};
    task.trackingInfo.allUsers.lastMonth = {tracked: 0, earned: 0};
    task.trackingInfo.allUsers.thisMonth = {tracked: 0, earned: 0};
    task.trackingInfo.allUsers.lastWeek = {tracked: 0, earned: 0};
    task.trackingInfo.allUsers.thisWeek = {tracked: 0, earned: 0};
    task.trackingInfo.allUsers.yesterday = {tracked: 0, earned: 0};
    task.trackingInfo.allUsers.today = {tracked: 0, earned: 0};

    let allTasksCount = Tasks.find({projectId: task.projectId}).count();
    let completedTasksCount = Tasks.find({projectId: task.projectId, status: 'Closed', archived: true}).count();

    let taskId = Tasks.insert(task);
    Roles.addUsersToRoles(userId, ['task-owner'], taskId);

    _addNewTask(taskId);
    allTasksCount = allTasksCount + 1;
    Projects.update({_id: task.projectId}, {
      $set: {
        updatedAt: new Date(),
        'info.tasksCount': allTasksCount,
        'info.tasksCompleted': completedTasksCount
      }
    });

    return taskId;
  }
});

export const createTaskDesktop = new ValidatedMethod({
  name: 'tasks.createTaskDesktop',
  validate: new SimpleSchema({
    task: {
      type: new SimpleSchema({
        name: {
          type: String,
          min: 3,
          max: 50
        },
        description: {
          type: String,
          // min: 5,
          max: 5000,
          optional: true
        },
        projectId: {
          type: String
        },
        membersIds: {
          type: [String],
          regEx: SimpleSchema.RegEx.Id,
          optional: true
        },
        taskFiles: {
          type: [Object],
          optional: true
        },
        'taskFiles.$.fileName': {
          type: String,
          optional: true
        },
        'taskFiles.$.mediaLink': {
          type: String
        },
        'taskFiles.$.size': {
          type: Number,
          optional: true
        },
        'taskFiles.$.uploaded': {
          type: Date
        },
        'taskFiles.$.type': {
          type: String,
          optional: true
        },
        hardLimit: {
          type: Number,
          optional: true
        }
      })
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({task, userId}) {
    userId = userId || this.userId;
    const taskId = createTask.call({task, userId});
    return Tasks.findOne({_id: taskId});
  }
});

export const createTaskAndroid = new ValidatedMethod({
  name: 'tasks.createTaskAndroid',
  validate: new SimpleSchema({
    task: {
      type: new SimpleSchema({
        name: {
          type: String,
          min: 3,
          max: 50
        },
        description: {
          type: String,
          // min: 5,
          max: 5000,
          optional: true
        },
        projectId: {
          type: String
        },
        membersIds: {
          type: [String],
          regEx: SimpleSchema.RegEx.Id
        },
        taskFiles: {
          type: [Object],
          optional: true
        },
        'taskFiles.$.fileName': {
          type: String,
          optional: true
        },
        'taskFiles.$.mediaLink': {
          type: String
        },
        'taskFiles.$.size': {
          type: Number,
          optional: true
        },
        'taskFiles.$.uploaded': {
          type: Date
        },
        'taskFiles.$.type': {
          type: String,
          optional: true
        },
        hardLimit: {
          type: Number,
          optional: true
        }
      })
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({task, userId}) {
    userId = userId || this.userId;
    const taskId = createTask.call({task, userId});
    if (taskId) {
      return JSON.stringify(taskId);
    }
    return JSON.stringify(false);
  }
});

export const archiveTask = new ValidatedMethod({
  name: 'tasks.archiveTask',
  validate: new SimpleSchema({
    taskId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({taskId, userId}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('tasks.archiveTask.notLoggedIn',
        'Must be logged in.');
    }
    if (VZ.canUser('archiveTask', currentUserId, taskId)) {
      let booleanResponse = false;

      let task = Tasks.findOne({_id: taskId});
      let project = Projects.findOne({_id: task.projectId});

      let openedTasks = Tasks.find({projectId: project._id}).fetch();
      let closedTasks = Tasks.find({projectId: project._id, status: 'Closed', archived: true}).fetch();
      Tasks.update({_id: taskId}, {
        $set: {
          archived: true,
          status: 'Closed',
          editedAt: new Date(),
          editedBy: currentUserId
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


      let openedTasksIds = _.map(openedTasks, function (task) {
        return task._id;
      });
      let closedTasksIds = _.map(closedTasks, function (task) {
        return task._id;
      });
      closedTasksIds.push(taskId);
      _addCompleteTask(taskId);
      Projects.update({_id: task.projectId}, {
        $set: {
          updatedAt: new Date(),
          'info.tasksCount': openedTasksIds.length,
          'info.tasksCompleted': closedTasksIds.length
        }
      });

      let user = Meteor.users.findOne({_id: currentUserId});
      let notificationMsg = 'Task - ' + task.name + ' - archived by ' + user.profile.fullName + ' -';
      sendNotifications.call({
        title: 'Task archived',
        msg: notificationMsg,
        usersIdsArray: currentUserId,
        userId: currentUserId
      });
      return JSON.stringify(booleanResponse);
    } else {
      throw new Meteor.Error('tasks.restoreTask.permissionError', 'You can\'t archive this task!');
    }
  }
});

export const restoreTask = new ValidatedMethod({
  name: 'tasks.restoreTask',
  validate: new SimpleSchema({
    taskId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({taskId, userId}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('tasks.restoreTask.notLoggedIn',
        'Must be logged in.');
    }
    if (VZ.canUser('restoreTask', currentUserId, taskId)) {
      let booleanResponse = false;

      let task = Tasks.findOne({_id: taskId});
      let project = Projects.findOne({_id: task.projectId});
      let openedTasks = Tasks.find({projectId: project._id}).fetch();
      let closedTasks = Tasks.find({projectId: project._id, status: 'Closed', archived: true}).fetch();

      Tasks.update({_id: taskId}, {
        $set: {
          archived: false,
          status: 'Opened',
          editedAt: new Date(),
          editedBy: currentUserId
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
      let openedTasksIds = _.map(openedTasks, function (task) {
        return task._id;
      });
      let closedTasksIds = _.map(closedTasks, function (task) {
        return task._id;
      });
      closedTasksIds = _.reject(closedTasksIds, function (id) {
        return id === taskId;
      });
      _addNewTask(taskId);
      Projects.update({_id: task.projectId}, {
        $set: {
          updatedAt: new Date(),
          'info.tasksCount': openedTasksIds.length,
          'info.tasksCompleted': closedTasksIds.length
        }
      });

      let user = Meteor.users.findOne({_id: currentUserId});
      let notificationMsg = 'Task - ' + task.name + ' - restored by ' + user.profile.fullName + ' -';
      sendNotifications.call({
        title: 'Task restored',
        msg: notificationMsg,
        usersIdsArray: [currentUserId],
        userId: currentUserId
      });
      return JSON.stringify(booleanResponse);
    } else {
      throw new Meteor.Error('tasks.restoreTask.permissionError', 'You can\'t restore this task!');
    }
  }
});

export const archiveTasks = new ValidatedMethod({
  name: 'tasks.archiveTasks',
  validate: new SimpleSchema({
    taskIds: {
      type: [String]
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({taskIds, userId}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('tasks.archiveTasks.notLoggedIn',
        'Must be logged in.');
    }
    let booleanResponse = false;
    Tasks.update({_id: {$in: taskIds}}, {
      $set: {
        archived: true,
        status: 'Closed',
        editedAt: new Date(),
        editedBy: currentUserId
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

    for (let i = 0; i < taskIds.length; i++) {
      let task = Tasks.findOne({_id: taskIds[i]});
      let project = Projects.findOne({_id: task.projectId});
      let openedTasks = Tasks.find({projectId: project._id}).fetch();
      let closedTasks = Tasks.find({projectId: project._id, status: 'Closed', archived: true}).fetch();

      let openedTasksIds = _.map(openedTasks, function (task) {
        return task._id;
      });
      let closedTasksIds = _.map(closedTasks, function (task) {
        return task._id;
      });
      closedTasksIds.push(task._id);

      Projects.update({_id: task.projectId}, {
        $set: {
          updatedAt: new Date(),
          'info.tasksCount': openedTasksIds.length,
          'info.tasksCompleted': closedTasksIds.length
        }
      });
    }
    return JSON.stringify(booleanResponse);
  }
});

export const restoreTasks = new ValidatedMethod({
  name: 'tasks.restoreTasks',
  validate: new SimpleSchema({
    taskIds: {
      type: [String]
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({taskIds, userId}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('tasks.restoreTasks.notLoggedIn',
        'Must be logged in.');
    }
    let booleanResponse = false;
    Tasks.update({_id: {$in: taskIds}}, {
      $set: {
        archived: false,
        status: 'Opened',
        editedAt: new Date(),
        editedBy: currentUserId
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

    for (let i = 0; i < taskIds.length; i++) {
      let currentTask = Tasks.findOne({_id: taskIds[i]});
      let project = Projects.findOne({_id: currentTask.projectId});
      let openedTasks = Tasks.find({projectId: project._id}).fetch();
      let closedTasks = Tasks.find({projectId: project._id, status: 'Closed', archived: true}).fetch();


      let openedTasksIds = _.map(openedTasks, function (task) {
        return task._id;
      });
      let closedTasksIds = _.map(closedTasks, function (task) {
        return task._id;
      });
      closedTasksIds = _.reject(closedTasksIds, function (id) {
        return id === currentTask._id;
      });
      Projects.update({_id: currentTask.projectId}, {
        $set: {
          updatedAt: new Date(),
          'info.tasksCount': openedTasksIds.length,
          'info.tasksCompleted': closedTasksIds.length
        }
      });
    }
    return JSON.stringify(booleanResponse);
  }
});

export const assignWorkerToTask = new ValidatedMethod({
  name: 'tasks.assignWorkerToTask',
  validate: new SimpleSchema({
    taskId: {
      type: String
    },
    assignedUsersWithPositions: {type: [String]},
    assignedUsersWithPositionsBeforeChanges: {type: [String]}
  }).validator(),
  run({taskId, assignedUsersWithPositions, assignedUsersWithPositionsBeforeChanges}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('tasks.assignWorkerToTask.notLoggedIn',
        'Must be logged in.');
    }
    let taskToUpdate = Tasks.findOne(taskId);

    if (!taskToUpdate) {
      throw new Meteor.Error('Task not exist!');
    }

    if (!VZ.canUser('assignUserToTask', userId, taskId) && !VZ.canUser('viewDashboard', userId, taskToUpdate.projectId)) {// need to be editProject
      throw new Meteor.Error('You\'re not allowed to assign users to this task!');
    }

    let availablePositions = VZ.UserRoles.Tasks.userPositions;

    // check whether all changed positions can be updated by current user
    // and update roles after that
    changeUserRoles(taskId,
      assignedUsersWithPositionsBeforeChanges, assignedUsersWithPositions, availablePositions);

    // If user roles was updated - update company workers list
    let assignedUsersMap = fillAssignedUsersMap(assignedUsersWithPositions, availablePositions);
    Tasks.update({_id: taskId}, {$set: assignedUsersMap});
  }
});

export const deleteTaskFile = new ValidatedMethod({
  name: 'tasks.deleteTaskFile',
  validate: new SimpleSchema({
    taskId: {
      type: String
    },
    fileName: {
      type: String
    }
  }).validator(),
  run({taskId, fileName}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('tasks.deleteTaskFile.notLoggedIn',
        'Must be logged in.');
    }
    Tasks.update(taskId, {
      $set: {
        editedAt: new Date(),
        editedBy: this.userId
      }, $pull: {taskFiles: {fileName: fileName}}
    });

  }
});

export const addUserToTask = new ValidatedMethod({
  name: 'tasks.addUserToTask',
  validate: new SimpleSchema({
    userId: {
      type: String
    },
    taskId: {
      type: String
    },
    projectId: {
      type: String
    }
  }).validator(),
  run({userId, taskId, projectId}) {
    const currentUserId = this.userId;
    if (!userId) {
      throw new Meteor.Error('tasks.addUserToTask.notLoggedIn',
        'Must be logged in.');
    }
    if (!VZ.canUser('addUserToTask', currentUserId, projectId)) {
      throw new Meteor.Error('tasks.addUserToTask.permissionError', 'You can\'t assign user\'s to task!');
    }
    else if (!VZ.canUser('addUserToTask', userId, projectId)) {
      throw new Meteor.Error('tasks.addUserToTask.permissionError', 'User can\'t be assigned to task');
    }
    else if (Roles.userIsInRole(userId, 'task-member', taskId)) {
      throw new Meteor.Error('tasks.addUserToTask.permissionError', 'User is already a task member');
    }
    else {
      Tasks.update(taskId, {
        $set: {
          editedAt: new Date(),
          editedBy: currentUserId
        }, $addToSet: {membersIds: userId}
      });
      let users = [];
      users.push(userId);
      _addUsersToTask(taskId, users);
      Roles.addUsersToRoles(userId, 'task-member', taskId);
    }
  }
});

export const removeUserFromTask = new ValidatedMethod({
  name: 'tasks.removeUserFromTask',
  validate: new SimpleSchema({
    userId: {
      type: String
    },
    taskId: {
      type: String
    },
    projectId: {
      type: String
    }
  }).validator(),
  run({userId, taskId, projectId}) {
    const currentUserId = this.userId;
    if (!userId) {
      throw new Meteor.Error('tasks.removeUserFromTask.notLoggedIn',
        'Must be logged in.');
    }
    if (!VZ.canUser('addUserToTask', currentUserId, projectId)) {
      throw new Meteor.Error('tasks.removeUserFromTask.permissionError', 'You can\'t remove user\'s from task!');
    }
    else {
      Tasks.update(taskId, {
        $set: {
          editedAt: new Date(),
          editedBy: currentUserId
        }, $pull: {membersIds: userId}
      });
      let users = [];
      users.push(userId);
      _removeUsersFromTask(taskId, users);
      Roles.removeUsersFromRoles(userId, 'task-member', taskId);
    }
  }
});

export const updateTask = new ValidatedMethod({
  name: 'tasks.updateTask',
  validate: new SimpleSchema({
    taskId: {
      type: String
    }
  }).validator(),
  run({taskId}) {
    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('tasks.updateTask.notLoggedIn',
        'Must be logged in.');
    }
    Tasks.update(taskId, {$set: {editedAt: new Date(), editedBy: currentUserId}});
  }
});

export const updateTaskAndroidApp = new ValidatedMethod({
  name: 'tasks.updateTaskAndroidApp',
  validate: new SimpleSchema({
    taskId: {
      type: String
    },
    task: {
      type: new SimpleSchema({
        name: {
          type: String,
          min: 3,
          max: 50,
          optional: true
        },
        description: {
          type: String,
          max: 5000,
          optional: true
        },
        membersIds: {
          type: [String],
          regEx: SimpleSchema.RegEx.Id,
          optional: true
        },
        taskFiles: {
          type: [Object],
          optional: true
        },
        'taskFiles.$.fileName': {
          type: String,
          optional: true
        },
        'taskFiles.$.mediaLink': {
          type: String
        },
        'taskFiles.$.size': {
          type: Number,
          optional: true
        },
        'taskFiles.$.uploaded': {
          type: Date
        },
        'taskFiles.$.type': {
          type: String,
          optional: true
        },
        hardLimit: {
          type: Number,
          optional: true
        }
      })
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({taskId, task, userId}) {
    let currentUserId = userId || this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('tasks.updateTaskAndroidApp.notLoggedIn', 'Must be logged in.');
    }
    task.editedAt = new Date();
    task.editedBy = currentUserId;
    Tasks.update({_id: taskId}, {$set: task}, {}, function (err, numberAffected) {
      if (err) {
        return JSON.stringify(false);
      }
      else if (numberAffected === 0) {
        return JSON.stringify(false);
      }
      else if (numberAffected > 0) {
        return JSON.stringify(true);
      }
    });
  }
});

export const changeTaskStatus = new ValidatedMethod({
  name: 'tasks.changeTaskStatus',
  validate: new SimpleSchema({
    taskId: {
      type: String
    },
    status: {
      type: String
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({taskId, status, userId}) {
    userId = userId || this.userId;
    if (!userId) {
      throw new Meteor.Error('tasks.changeTaskStatus.notLoggedIn', 'Must be logged in.');
    }
    let booleanResponse = true;
    let query = {editedAt: new Date(), status: status, editedBy: userId};
    let task = Tasks.findOne({_id: taskId});
    let project = Projects.findOne({_id: task.projectId});
    let openedTasks = Tasks.find({projectId: project._id}).fetch();
    let closedTasks = Tasks.find({projectId: project._id, status: 'Closed', archived: true}).fetch();

    if (status === 'In-review') {
      query.sendToInReview = userId;
    }

    if (status === 'Closed') {
      query.archived = true;
      Tasks.update(taskId, {$set: query}, {}, function (err, numberAffected) {
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

      let openedTasksIds = _.map(openedTasks, function (task) {
        return task._id;
      });
      let closedTasksIds = _.map(closedTasks, function (task) {
        return task._id;
      });
      closedTasksIds.push(taskId);
      _addCompleteTask(taskId);


      Projects.update({_id: task.projectId}, {
        $set: {
          updatedAt: new Date(),
          'info.tasksCount': openedTasksIds.length,
          'info.tasksCompleted': closedTasksIds.length
        }
      });

    }
    if (status === 'Opened') {
      query.archived = false;

      Tasks.update(taskId, {$set: query}, {}, function (err, numberAffected) {
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

      let openedTasksIdsP = _.map(openedTasks, function (task) {
        return task._id;
      });
      let closedTasksIdsP = _.map(closedTasks, function (task) {
        return task._id;
      });
      closedTasksIdsP = _.reject(closedTasksIdsP, function (id) {
        return id === taskId;
      });

      Projects.update({_id: task.projectId}, {
        $set: {
          updatedAt: new Date(),
          'info.tasksCount': openedTasksIdsP.length,
          'info.tasksCompleted': closedTasksIdsP.length
        }
      });
    }
    Tasks.update(taskId, {$set: query}, {_returnObject: true}, function (err, numberAffected) {
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
    return JSON.stringify(booleanResponse);
  }
});

export const addYoutubeVideo = new ValidatedMethod({
  name: 'tasks.addYoutubeVideo',
  validate: new SimpleSchema({
    url: {
      type: String,
      regEx: /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g
    },
    taskId: {
      type: String
    }
  }).validator(),
  run({url, taskId}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('tasks.addYoutubeVideo.notLoggedIn',
        'Must be logged in.');
    }
    let youTubeVideo = {mediaLink: url, uploaded: new Date(), type: 'video'};
    if (taskId != 'new-task') {
      Tasks.update(taskId, {
        $set: {
          editedAt: new Date(),
          editedBy: this.userId
        }, $push: {taskFiles: youTubeVideo}
      });
    }
    else {
      return youTubeVideo;
    }
  }
});

export const updateHardLimit = new ValidatedMethod({
  name: 'tasks.updateHardLimit',
  validate: new SimpleSchema({
    taskId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    hardLimit: {
      type: Number
    }
  }).validator(),
  run({taskId, hardLimit}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('tasks.updateHardLimit.notLoggedIn',
        'Must be logged in.');
    }
    Tasks.update({_id: taskId}, {
      $set: {
        hardLimit: hardLimit,
        editedAt: new Date(),
        editedBy: userId
      }
    });
  }
});

export const getTasksForDesktopApp = new ValidatedMethod({
  name: 'tasks.getTasksForDesktopApp',
  validate: new SimpleSchema({
    appUserId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    projectId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true,
    },
  }).validator(),
  run({appUserId, projectId}) {
    const userId = appUserId || this.userId;

    let query = {
      membersIds: userId
    };
    if (projectId) {
      query.projectId = projectId;
    }

    return Tasks.find(query).fetch();
  }
});

export const getTaskById = new ValidatedMethod({
  name: 'tasks.getTaskById',
  validate: new SimpleSchema({
    taskId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({taskId}) {
    let project = Tasks.findOne({_id: taskId});
    return JSON.stringify(project);
  }
});

export const updateTaskTrackingInfoAndroid = new ValidatedMethod({
  name: 'tasks.updateTaskTrackingInfoAndroid',
  validate: new SimpleSchema({
    taskId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    trackedTime: {
      type: Number,
      min: 0
    },
    taskFiles: {
      type: [Object],
      optional: true
    },
    'taskFiles.$.fileName': {
      type: String
    },
    'taskFiles.$.mediaLink': {
      type: String
    },
    'taskFiles.$.size': {
      type: Number
    },
    'taskFiles.$.uploaded': {
      type: String
    }
  }).validator(),
  run({taskId, userId, trackedTime, taskFiles}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('tasks.updateTaskTrackingInfoAndroid', 'Must be logged in.');
    }
    let task = Tasks.findOne({_id: taskId});
    if (!task) {
      throw new Meteor.Error('tasks.updateTaskTrackingInfoAndroid', 'Task not found');
    }
    let userContract = Contracts.findOne({workerId: userId, status: {$in: ['active']}});
    if (!userContract) {
      throw new Meteor.Error('tasks.updateTaskTrackingInfoAndroid', 'User don\'t have active contract !');
    }
    taskFiles = taskFiles || [];

    const oneHour = 1000 * 60 * 60;
    const projectId = task.projectId;
    let rate = userContract.paymentInfo.rate;
    let contractTrackingInfo = userContract.trackingInfo;

    _.each(contractTrackingInfo.allTime, function (track) {
      if (track.projectId === projectId) {
        let newTracked = track.tracked + trackedTime;
        let newEarned = newTracked * rate / oneHour;
        track.tracked = newTracked;
        track.earned = newEarned;
      }
    });
    let contractId = userContract._id;
    Contracts.update({_id: contractId}, {$set: {trackingInfo: contractTrackingInfo}});


    let taskTrackingInfo = task.trackingInfo;
    let taskTrackingInfoAllUsers = taskTrackingInfo.allUsers;
    let taskTrackingInfoIndividual = taskTrackingInfo.individual;
    let taskTrackingInfoAllUsersTracks = [taskTrackingInfoAllUsers.allTime, taskTrackingInfoAllUsers.thisMonth, taskTrackingInfoAllUsers.thisWeek, taskTrackingInfoAllUsers.today];


    _.each(taskTrackingInfoAllUsersTracks, function (dayTrack) {
      let newTracked = dayTrack.tracked + trackedTime;
      let newEarned = newTracked * rate / oneHour;
      dayTrack.tracked = newTracked;
      dayTrack.earned = newEarned;
    });
    let currentUserIndividualTaskTrack = _.filter(taskTrackingInfoIndividual, (track) => {
      return track.userId === userId;
    });
    currentUserIndividualTaskTrack = currentUserIndividualTaskTrack[0];
    if (!currentUserIndividualTaskTrack) {
      currentUserIndividualTaskTrack = {};
      currentUserIndividualTaskTrack.userId = userId;
      currentUserIndividualTaskTrack.allTime = {tracked: 0, earned: 0};
      currentUserIndividualTaskTrack.lastMonth = {tracked: 0, earned: 0};
      currentUserIndividualTaskTrack.thisMonth = {tracked: 0, earned: 0};
      currentUserIndividualTaskTrack.lastWeek = {tracked: 0, earned: 0};
      currentUserIndividualTaskTrack.thisWeek = {tracked: 0, earned: 0};
      currentUserIndividualTaskTrack.yesterday = {tracked: 0, earned: 0};
      currentUserIndividualTaskTrack.today = {tracked: 0, earned: 0};
      taskTrackingInfoIndividual.push(currentUserIndividualTaskTrack);
    }

    _.each(taskTrackingInfoIndividual, (track) => {
      if (track.userId === userId) {
        let currentUserIndividualTracks = [track.allTime, track.thisMonth, track.thisWeek, track.today];
        _.each(currentUserIndividualTracks, (dayTrack) => {
          let newTracked = dayTrack.tracked + trackedTime;
          let newEarned = newTracked * rate / oneHour;
          dayTrack.tracked = newTracked;
          dayTrack.earned = newEarned;
        });
      }
    });


    taskFiles = _.map(taskFiles, (task) => {
      task.uploaded = new Date(task.uploaded);
      return task;
    });
    Tasks.update({_id: task._id}, {
      $set: {
        trackingInfo: {
          allUsers: taskTrackingInfoAllUsers,
          individual: taskTrackingInfoIndividual
        }
      }, $addToSet: {taskFiles: {$each: taskFiles}}
    });

    let project = Projects.findOne({_id: projectId});
    let projectTrackingInfo = project.trackingInfo;
    let projectTrackingInfoAllUsers = projectTrackingInfo.allUsers;
    let projectTrackingInfoIndividual = projectTrackingInfo.individual;
    let projectTrackingInfoAllUsersTracks = [projectTrackingInfoAllUsers.allTime, projectTrackingInfoAllUsers.thisMonth, projectTrackingInfoAllUsers.thisWeek, projectTrackingInfoAllUsers.today];

    _.each(projectTrackingInfoAllUsersTracks, function (dayTrack) {
      let newTracked = dayTrack.tracked + trackedTime;
      let newEarned = newTracked * rate / oneHour;
      dayTrack.tracked = newTracked;
      dayTrack.earned = newEarned;
    });
    let currentUserIndividualProjectTrack = _.filter(projectTrackingInfoIndividual, (track) => {
      return track.userId === userId;
    });
    currentUserIndividualProjectTrack = currentUserIndividualProjectTrack[0];

    if (!currentUserIndividualProjectTrack) {
      currentUserIndividualProjectTrack = {};
      currentUserIndividualProjectTrack.userId = userId;
      currentUserIndividualProjectTrack.allTime = {tracked: 0, earned: 0};
      currentUserIndividualProjectTrack.lastMonth = {tracked: 0, earned: 0};
      currentUserIndividualProjectTrack.thisMonth = {tracked: 0, earned: 0};
      currentUserIndividualProjectTrack.lastWeek = {tracked: 0, earned: 0};
      currentUserIndividualProjectTrack.thisWeek = {tracked: 0, earned: 0};
      currentUserIndividualProjectTrack.yesterday = {tracked: 0, earned: 0};
      currentUserIndividualProjectTrack.today = {tracked: 0, earned: 0};
      projectTrackingInfoIndividual.push(currentUserIndividualProjectTrack);
    }
    _.each(projectTrackingInfoIndividual, (track) => {
      if (track.userId === userId) {
        let currentUserIndividualTracks = [track.allTime, track.thisMonth, track.thisWeek, track.today];
        _.each(currentUserIndividualTracks, (dayTrack) => {
          let newTracked = dayTrack.tracked + trackedTime;
          let newEarned = newTracked * rate / oneHour;
          dayTrack.tracked = newTracked;
          dayTrack.earned = newEarned;
        });
      }
    });
    Projects.update({_id: project._id}, {
      $set: {
        trackingInfo: {
          allUsers: projectTrackingInfoAllUsers,
          individual: projectTrackingInfoIndividual
        }
      }
    });
  }
});

export const uploadTaskFilesAndroid = new ValidatedMethod({
  name: 'tasks.uploadTaskFilesAndroid',
  validate: new SimpleSchema({
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    taskId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    taskFiles: {
      type: [Object],
      optional: true
    },
    'taskFiles.$.fileName': {
      type: String
    },
    'taskFiles.$.mediaLink': {
      type: String
    },
    'taskFiles.$.size': {
      type: Number
    },
    'taskFiles.$.uploaded': {
      type: String
    }
  }).validator(),
  run({userId, taskId, taskFiles}) {
    const currentUserId = this.userId || userId;
    if (!currentUserId) {
      throw new Meteor.Error('tasks.uploadTaskFilesAndroid', 'Must be logged in.');
    }
    let task = Tasks.findOne({_id: taskId});
    if (!task) {
      throw new Meteor.Error('tasks.uploadTaskFilesAndroid', 'Task not found');
    }

    taskFiles = _.map(taskFiles, (file) => {
      file.uploaded = new Date(file.uploaded);
      return file;
    });

    Tasks.update({_id: taskId}, {
      $set: {
        editedBy: currentUserId,
        editedAt: new Date()
      }, $addToSet: {taskFiles: {$each: taskFiles}}
    });
  }
});