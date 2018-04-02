import {TimeEntries} from '../timeEntries';
import {Projects} from '/imports/api/projects/projects';
import {Tasks} from '/imports/api/tasks/tasks';
import {Contracts} from '/imports/api/contracts/contracts';
import {Screenshots} from '/imports/api/screenShots/screenShots';
import {VZ} from '/imports/startup/both/namespace';
import {publishComposite} from 'meteor/reywood:publish-composite';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {
  screensPublicationSchema,
  userRangeWorkTimeCardPubSchema,
  rangeWorkTimePubSchema,
  dashboardWorkerActivityCardSchema
} from '../timeEntries';

Meteor.publish('dashboardProjectsList', function () {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  const projectFields = {
    sort: {createdAt: 1},
    fields: {
      activityMessagesIds: 0,
      tags: 0,
      description: 0,
      projectFiles: 0
    }
  };

  let query = {
    $or: [
      {ownerId: userId},
      {assignedUsersIds: userId}
    ],
    archived: false
  };

  return Projects.find(query, projectFields);
});

publishComposite('dashboardInReviewCard', function (companyId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  let contractQuery = {
    employerId: userId,
    status: {$in: ['active', 'paused']}
  };
  const projectFields = {
    sort: {createdAt: 1},
    fields: {
      activityMessagesIds: 0,
      tags: 0,
      description: 0,
      projectFiles: 0
    }
  };
  const tasksFields = {
    sort: {createdAt: 1},
    fields: {
      taskFiles: 0,
      editedBy: 0,
      editedAt: 0
    }
  };
  if (companyId) {
    contractQuery.companyId = companyId;
  }
  return {
    find: function () {
      return Contracts.find(contractQuery);
    },
    children: [
      {
        find: function (contract) {
          return Projects.find({_id: {$in: contract.projectIds}, ownerId: userId, archived: false}, projectFields);
        },
        children: [
          {
            find: function (project, contract) {
              let query = {projectId: project._id, status: 'In-review'};
              return Tasks.find(query, tasksFields);
            },
            children: [
              {
                find: function (task, project, contract) {
                  return Meteor.users.find({_id: task.sendToInReview});
                }
              }
            ]
          }
        ]
      }
    ]
  }
});

publishComposite('projectTimeEntries', function (query, params) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  const options = {
    fields: {
      _id: 1,
      projectId: 1,
      taskId: 1,
      contractId: 1,
      paymentType: 1,
      paymentRate: 1,
      message: 1,
      startDate: 1,
      endDate: 1,
      _isActive: 1,
      userId: 1,
      workingDaysThisMonth: 1,
    }
  };
  params = _.extend(params, options);
  const optionsS = {
    sort: {takenAt: 1}, fields: {
      uploadedAt: 0
    }
  };

  return {
    find: function () {
      _.extend(query, {
        userId: userId
      });
      Counts.publish(this, 'user-time-entries', TimeEntries.find(query), { noReady: true });
      return TimeEntries.find(query, params);
    },
    children: [
      {
        find: function (timeEntry) {
          return Screenshots.find({timeEntryId: timeEntry._id}, optionsS);
        }
      }
    ]
  }
});

//TODO: canUser...
publishComposite('timeEntriesAndScreenshots', function (query = {}) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  // screensPublicationSchema.validate(query);
  const timeEntriesOptions = {
    sort: {startDate: 1}, fields: {
      _id: 1,
      startDate: 1,
      userId: 1,
      message: 1
    }
  };
  const screenshotsOptions = {
    sort: {takenAt: 1}, fields: {
      uploadedAt: 0
    }
  };

  return {
    find: function () {
      _.extend(query, {
        userId: userId
      });
      return TimeEntries.find(query, timeEntriesOptions);
    },
    children: [
      {
        find: function (timeEntry) {
          return Screenshots.find({timeEntryId: timeEntry._id}, screenshotsOptions);
        }
      }
    ]
  }
});

publishComposite('timeEntriesAndScreenshotsWorker', function (query = {}, companyId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  // screensPublicationSchema.validate(query);
  // check(companyId, String);

  const timeEntriesOptions = {
    sort: {startDate: 1}, fields: {
      _id: 1,
      startDate: 1,
      userId: 1,
      message: 1
    }
  };
  const screenshotsOptions = {
    sort: {takenAt: 1}, fields: {
      uploadedAt: 0
    }
  };
  let contractQuery = {employerId: userId};
  if (companyId) {
    contractQuery.companyId = companyId;
  }
  let children = [
    {
      find: function (contract) {
        query.contractId = contract._id;
        return TimeEntries.find(query, timeEntriesOptions);
      },
      children: [
        {
          find: function (timeEntry, contract) {
            return Screenshots.find({timeEntryId: timeEntry._id}, screenshotsOptions);
          }
        }
      ]
    }
  ];
  return {
    find: function () {
      return Contracts.find(contractQuery);
    },
    children: children
  }
});

Meteor.publish('activeTimeEntry', function (projectId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  let query = {
    _isActive: true,
    userId: userId
  };
  if (projectId) {
    query.projectId = projectId;
  }
  new SimpleSchema({
    projectId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({projectId});

  return TimeEntries.find(query);
});

Meteor.publish('timeEntriesClientGoogle', function (data) {
  console.log('publish timeEntriesClientGoogle', data.userId);
  if (data.userId && VZ.canUser('viewTimeEntriesRelatedToProject', data.userId, data.projectId)) {
    const query = {
      userId: data.userId,
      projectId: data.projectId,
      taskId: data.taskId,
      startDate: data.startDate,
      _done: true,
      _isActive: false
    };
    return TimeEntries.find(query);
  } else {
    return this.ready();
  }
});

Meteor.publish('desktopAllUserTimeEntries', function (desktopUserId) {
  console.log('publish desktopAllUserTimeEntries', desktopUserId);
  const userId = desktopUserId || this.userId;
  if (!userId) {
    return this.ready();
  }
  const query = {
    userId: userId,
    _done: true,
    _isActive: false
  };
  return TimeEntries.find(query);
});

Meteor.publish('activeTimeEntryClientGoogle', function (userId, projectId, taskId) {
  console.log('publish activeTimeEntryClientGoogle', userId);
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    projectId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    taskId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({userId, projectId, taskId});

  const query = {
    _isActive: true,
    userId,
    projectId,
    taskId
  };
  return TimeEntries.find(query);
});


Meteor.publish('activeTimeEntryTab', function () {
  const userId =  this.userId;
  if (!userId) {
    return this.ready();
  }

  let user = Meteor.users.findOne({_id: userId});
  let entryId = user && user.profile && user.profile.entryId;
  if (entryId) {
    return TimeEntries.find({_id: entryId});
  }
  else {
    return this.ready();
  }
});

publishComposite('myReports', function (dateRange, messageFilter) {
  let userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  rangeWorkTimePubSchema.validate({dateRange, messageFilter});

  let start = moment(dateRange.date).startOf(VZ.dateRanges[dateRange.range]).toDate();
  let end = moment(dateRange.date).endOf(VZ.dateRanges[dateRange.range]).toDate();

  let query = {
    userId: userId,
    startDate: {
      $gte: start,
      $lte: end
    }
  };

  if (messageFilter && messageFilter.trim().length > 0) {
    query.message = {$regex: messageFilter}
  }

  return {
    find: function () {
      return TimeEntries.find(query);
    },
    children: [
      {
        find: function (timeEntry) {
          return Projects.find({_id: timeEntry.projectId});
        }
      },
      {
        find: function (timeEntry) {
          return Tasks.find({_id: timeEntry.taskId});
        }
      }
    ]
  }
});

Meteor.publish('userRangeWorkTime', function (dateRange, ids, messageFilter) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  userRangeWorkTimeCardPubSchema.pick('dateRange', 'ids', 'ids.$', 'messageFilter').validate({
    dateRange,
    ids,
    messageFilter
  });

  if (ids && ids.length > 0) {
    let start = moment(dateRange.date).startOf(VZ.dateRanges[dateRange.range]).toDate();
    let end = moment(dateRange.date).endOf(VZ.dateRanges[dateRange.range]).toDate();

    let query = {
      userId: {$in: ids},
      startDate: {
        $gte: start,
        $lte: end
      }
    };
    if (messageFilter && messageFilter.trim().length > 0) {
      query.message = {$regex: messageFilter, $options: 'gi'}
    }
    return TimeEntries.find(query);
  }
});

publishComposite('workerReports', function (dateRange, ids, messageFilter) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  userRangeWorkTimeCardPubSchema.validate({dateRange, ids, messageFilter});

  let contractQuery = {
    employerId: userId
  };
  let query = {};
  if (ids && ids.length > 0) {
    let start = moment(dateRange.date).startOf(VZ.dateRanges[dateRange.range]).toDate();
    let end = moment(dateRange.date).endOf(VZ.dateRanges[dateRange.range]).toDate();
    query.userId = {$in: ids};
    query.startDate = {
      $gte: start,
      $lte: end
    };
  }
  let user = Meteor.users.findOne({_id: userId});
  let companyId = user.profile && user.profile.selectedCompanyId;
  if (companyId) {
    contractQuery.companyId = companyId;
  }
  return {
    find: function () {
      return  Contracts.find(contractQuery);
    },
    children: [
      {
        find: function (contract) {
          query.contractId = contract._id;
          if (messageFilter && messageFilter.trim().length > 0) {
            query.message = {$regex: messageFilter, $options: 'gi'}
          }
          return TimeEntries.find(query);
        },
        children: [
          {
            find: function (timeEntry, contract) {
              return Projects.find({_id: timeEntry.projectId});
            }
          },
          {
            find: function (timeEntry, contract) {
              return Tasks.find({_id: timeEntry.taskId});
            }
          }
        ]
      }
    ]
  }
});

publishComposite('dashboardWorkerActivityCard', function (dateRange, companyId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  dashboardWorkerActivityCardSchema.validate({dateRange, companyId});

  let contractQuery = {
    employerId: userId,
    status: {$in: ['active', 'paused']}
  };
  let query = {};
  let start = moment(dateRange.date).startOf(VZ.dateRanges[dateRange.range]).toDate();
  let end = moment(dateRange.date).endOf(VZ.dateRanges[dateRange.range]).toDate();
  query.startDate = {
    $gte: start,
    $lte: end
  };
  query.endDate = {$exists: true};
  query._isActive = false;
  query._done = true;
  const options = {
    fields: {
      _id: 1,
      projectId: 1,
      taskId: 1,
      contractId: 1,
      paymentType: 1,
      paymentRate: 1,
      message: 1,
      startDate: 1,
      endDate: 1,
      _isActive: 1,
      _done: 1,
      userId: 1
    }
  };
  const profileOptions = {
    fields: {profile: 1, roles: 1, emails: 1}
  };
  if (companyId) {
    contractQuery.companyId = companyId;
  }
  return {
    find: function () {
      return Contracts.find(contractQuery);
    },
    children: [
      {
        find: function (contract) {
          query.contractId = contract._id;
          query.userId = contract.workerId;
          return TimeEntries.find(query, options);
        }
      },
      {
        find: function (contract) {
          return Meteor.users.find({_id: contract.workerId}, profileOptions);
        }
      }
    ]
  }
});

publishComposite('entriesByIds', function (ids) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  new SimpleSchema({
    ids: {
      type: [String],
      regEx: SimpleSchema.RegEx.Id

    }
  }).validate({ ids });

  return {
    find: function () {
      return TimeEntries.find({_id: {$in: ids}}, {
        fields: {
          _id: 1,
          projectId: 1,
          taskId: 1,
          contractId: 1,
          paymentType: 1,
          paymentRate: 1,
          message: 1,
          startDate: 1,
          endDate: 1,
          _isActive: 1,
          userId: 1
        }
      });
    },
    children: [
      {
        find: function (entry) {
          return Tasks.find({_id: entry.taskId}, {fields: {trackingInfo: 1, membersIds: 1, name: 1, taskKey: 1, projectId: 1, archived: 1, status: 1}});
        }
      }
    ]
  }
});