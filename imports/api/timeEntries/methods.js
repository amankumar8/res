import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { TimeEntries, TimeEntrySchema, clientStartTrackingSchema, startTrackingSiteSchema, editTimeEntrySchema } from './timeEntries';
import { Projects } from '/imports/api/projects/projects';
import { Contracts } from '/imports/api/contracts/contracts';
import { Screenshots } from '/imports/api/screenShots/screenShots';
import { EntryTags } from '/imports/api/entryTags/entryTags';
import { sendNotifications } from '/imports/api/notifications/methods';
import { uploadPhoto } from '/imports/api/google-services/google-api/methods';

export const startTracking = new ValidatedMethod({
    name: 'startTracking',
    validate: TimeEntrySchema.validator(),

    run(query) {
        const userId = query.userId;
        if (checkIsExistActiveTimeEntry.call({userId})) {
            throw new Meteor.Error('startTracking.activeTasksError', 'Only 1 active task allowed!');
        }

        query.startDate = _.isDate(query.startDate) ? query.startDate : new Date();

        const activeTimeEntryId = TimeEntries.insert(query, function (error) {
            if (error) {
                console.log(error);
                throw new Meteor.Error('startTracking.startFailed', 'Time start failed');
            }
            // console.log('start tracking ', userId, activeTimeEntryId);
        });
        // console.log(activeTimeEntryId);
        Meteor.users.update({_id: userId}, {$set: {'profile.entryId': activeTimeEntryId}});
        return activeTimeEntryId;
    }
});

export const stopTracking = new ValidatedMethod({
    name: 'stopTracking',
    validate: new SimpleSchema({
        entryId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({entryId, userId}) {
        // let userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('stopTracking.notLoggedIn',
                'Stop tracking may only authorized user!');
        }
        if(Meteor.isServer){
            import Future from 'fibers/future';
            let stopTrackingSync = new Future();
            if (!checkIsExistActiveTimeEntry.call({userId})) {
                //throw new Meteor.Error('No active tasks!');
                stopTrackingSync.throw('No active tasks!');
                return;
            }
            let entry = TimeEntries.findOne(entryId);
            if (!entry || userId != entry.userId) {
                //throw new Meteor.Error('Time entry\'s user id doesn\'t not match yours');
                stopTrackingSync.throw('Time entry\'s user id doesn\'t not match yours');
                return;
            }
            if (!entry.endDate) {
                let endDate = new Date();
                TimeEntries.update({
                    _id: entry._id
                }, {
                    $set: {
                        endDate: endDate,
                        _done: true,
                        _isActive: false,
                        _totalMinutes: moment(endDate).diff(entry.startDate, 'm')
                    }
                }, function (error) {
                    if (error) {
                        //to logger later
                        //throw new Meteor.Error('Failed stop tracking');
                        stopTrackingSync.throw('Failed to stop tracking');
                        return;
                    }
                    // console.log('stop tracking ', userId, entryId);

                    const timeEntryUpdated = TimeEntries.findOne(entry._id);
                    let query = {
                        $unset: {'profile.entryId': ''}
                    };
                    query.$set = {'profile.lastWorkedEntryId': entry._id};
                    if (Meteor.isServer) {
                      import { addTrackValue } from '/imports/api/timeEntriesCalculations/server';
                      addTrackValue(timeEntryUpdated);
                    }
                    stopTrackingSync.return(TimeEntries.findOne({_id: entry._id}));
                    Meteor.users.update({_id: userId}, query);
                });
            } else {
                //throw new Meteor.Error('Not Authorised', 'You already finished your task.');
                stopTrackingSync.throw('Not Authorised', 'You already finished your task.');
                return;
            }
            return stopTrackingSync.wait();
        }
    }
});


export const startTrackingSite = new ValidatedMethod({
    name: 'startTrackingSite',
    validate: startTrackingSiteSchema.validator(),

    run(query) {
        throw new Meteor.Error('not working error','Please use desktop tracker to track your time');
        // TODO this method producing not correct timeEntries which make time and earned count results incorrect
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('startTrackingSite.notLoggedIn',
                'Start tracking may only authorized user!');
        }
        let contract = Contracts.findOne({projectIds: query.projectId, workerId: userId});
        if (contract && contract.status === 'active') {
            query.contractId = contract._id;
            query.paymentType = contract.paymentInfo.type;
            query.paymentRate = contract.paymentInfo.rate;
        }

        query.userId = userId;
        query._isActive = true;
        query._done = false;
        return startTracking.call(query);
    }
});

export const clientStartTracking = new ValidatedMethod({
    name: 'clientStartTracking',
    validate: clientStartTrackingSchema.validator(),
    run(data) {
        let userId = this.userId || data.userId;
        if (!userId) {
            throw new Meteor.Error('clientStartTracking.notLoggedIn',
                'Start tracking may only authorized user!');
        }
        let query = {
            userId: userId,
            projectId: data.projectId,
            taskId: data.taskId,
            contractId: data.contractId,
            paymentType: data.paymentType,
            paymentRate: data.paymentRate,
            message: data.message,
            _done: false,
            _isManual: false,
            _isActive: true,
            _initiatedByDesktopApp: true,
            _trackedByDesktopApp: true,
            countKeyboardEvents: data.countKeyboardEvents,
            countMouseEvents: data.countMouseEvents,
        };
        if (query.paymentType === 'monthly') {
            query = Object.assign(query, {
              workingDaysThisMonth: data.workingDaysThisMonth,
              workingTimeLeft: data.workingTimeLeft
            });
        }
        const activeTimeEntryId = startTracking.call(query);
        return TimeEntries.findOne({_id: activeTimeEntryId});
    }
});

export const getActiveTimeEntryId = new ValidatedMethod({
    name: 'getActiveTimeEntryId',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('getActiveTimeEntryId.notLoggedIn',
                'Must be authorized!');
        }
        let activeTimeEntry = TimeEntries.findOne({_isActive: true, userId: userId});
        return activeTimeEntry ? activeTimeEntry._id : undefined;
    }
});

export const getActiveTimeEntry = new ValidatedMethod({
    name: 'getActiveTimeEntry',
    validate: null,

    run({ userId }) {
        if(!userId) {
            throw new Meteor.Eror('getActiveTimeEntry.notLoggedIn',
                'You should be logged in to perform this action')
        } else {
            return TimeEntries.findOne({userId, _isActive: true});
        }
    }
});

export const sendActiveTimeEntryFromDesktop = new ValidatedMethod({
    name: 'sendActiveTimeEntryFromDesktop',
    validate: null,

    run({ userId, activeTimeEntry }) {
        if(!userId) {
            throw new Meteor.Error('sendActiveTimeEntryFromDesktop.notLoggedIn',
                'You should be logged in to perform this action')
        } else if(!activeTimeEntry) {
            throw new Meteor.Error('sendActiveTimeEntryFromDesktop.dataNotSpecified',
                'Time entry not specified')
        } else {
            const timeEntry = TimeEntries.findOne(activeTimeEntry._id);
            if(timeEntry) {
                TimeEntries.update(timeEntry._id, {$set: activeTimeEntry});
            } else {
                const id = TimeEntries.insert(activeTimeEntry);
            }
        }
    }
});

export const createEntryTag = new ValidatedMethod({
    name: 'createEntryTag',
    validate: new SimpleSchema({
        tag: {
            type: String
        }
    }).validator(),
    run({tag}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('createEntryTag.notLoggedIn',
                'Must be authorized!');
        }
        EntryTags.insert({
                name: tag,
                userId: userId,
                createdAt: new Date()
            },
            function (error) {
                if (error) {
                    throw new Meteor.Error('createEntryTag.failedToInsert', 'Failed to insert');
                }
            });
    }
});

export const editTimeEntry = new ValidatedMethod({
    name: 'editTimeEntry',
    validate: editTimeEntrySchema.validator(),
    run(changeObj) {
        const userId = this.userId;
        let id = changeObj._id;
        changeObj = _.omit(changeObj, '_id');
        if (!userId) {
            throw new Meteor.Error('editTimeEntry.notLoggedIn',
                'Must be authorized!');
        }

        _.each(changeObj, function (value, key) {
            if (key === 'startDate' || key === 'endDate') {
                check(value, Date);
            } else if (key === '_totalMinutes') {
                check(value, Number);
            } else if (key === 'tags') {
                check(value, [String])
            } else {
                check(value, String)
            }
        });

        let timeEntry = TimeEntries.findOne({_id: id});
        if (moment(timeEntry.startDate).startOf('month') < moment().startOf('month')) {
            throw new Meteor.Error('expired-error', 'cannot update already payed time entries');
        }
        // TODO _totalMinutes is obsolete and not used, remove it
        let minutesBeforeUpdate = timeEntry._totalMinutes;
        let minutesAfterUpdate = changeObj._totalMinutes;
        if (timeEntry.paymentType === 'monthly') {
            changeObj.workingTimeLeft = timeEntry.workingTimeLeft + (timeEntry.endDate - timeEntry.startDate);
            changeObj.workingTimeLeft -= changeObj.endDate - changeObj.startDate;
        }

        TimeEntries.update({_id: id}, {$set: changeObj});

        const timeEntryUpdated = TimeEntries.findOne({_id: id});
        if (Meteor.isServer) {
          import { updateTrackValue } from '/imports/api/timeEntriesCalculations/server';
          updateTrackValue(timeEntry, timeEntryUpdated.startDate, timeEntryUpdated.endDate);
        }

        //-------------------NOTIFICATIONS SENDING----------------------------
        if (minutesAfterUpdate != minutesBeforeUpdate && timeEntry.projectId) {
            let user = Meteor.users.findOne({_id: userId});
            let project = Projects.findOne({_id: timeEntry.projectId});
            let projectOwner = project.ownerId;
            let query = {};
            query['roles.' + timeEntry.projectId] = {$in: ['project-manager', 'project-admin']};
            let managersAndAdmins = Meteor.users.find(query).fetch();
            managersAndAdmins = _.map(managersAndAdmins, function (doc) {
                return doc._id;
            });
            managersAndAdmins.push(userId);
            managersAndAdmins = _.uniq(managersAndAdmins);

            let msg = 'Timetracker - hours modified by user ' + user.profile.fullName + ' for project ' + project.name;
            sendNotifications.call({
                title: 'Modified manual hours',
                msg: msg,
                usersIdsArray: [projectOwner]
            });
        }
    }
});

export const timeEntriesCount = new ValidatedMethod({
    name: 'timeEntriesCount',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('timeEntriesCount.notLoggedIn',
                'Must be authorized!');
        }
        let timeEntriesCount = TimeEntries.find({
            userId: userId,
            _done: true,
            _isActive: false
        }).count();

        return timeEntriesCount ? timeEntriesCount : undefined;
    }
});

export const deleteTimeEntryGroup = new ValidatedMethod({
    name: 'deleteTimeEntryGroup',
    validate: new SimpleSchema({
        ids: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({ids}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('deleteTimeEntryGroup.notLoggedIn',
                'Must be authorized!');
        }
        const timeEntries = TimeEntries.find({_id: {$in: ids}}).fetch();
        TimeEntries.remove({_id: {$in: ids}});

        timeEntries.forEach(timeEntry => {
            if (Meteor.isServer) {
              import { subtractTrackValue } from '/imports/api/timeEntriesCalculations/server';
              subtractTrackValue(timeEntry);
            }
        });
    }
});


/**
 * Remove time entry
 * @param {string} timeEntryId - id of timeEntry, that should be removed
 */
export const removeTimeEntry = new ValidatedMethod({
    name: 'removeTimeEntry',
    validate: new SimpleSchema({
        timeEntryId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        },
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            optional: true,
        },
    }).validator(),
    run(data) {
        const userId = this.userId || data.userId;
        if (!userId) {
            throw new Meteor.Error('removeTimeEntry.notLoggedIn',
                'Must be authorized!');
        }

        let timeEntry = TimeEntries.findOne(data.timeEntryId, {fields: {_id: 1, userId: 1}});
        if (!timeEntry) {
            throw new Meteor.Error('Time entry not found')
        }
        if (timeEntry.userId != userId) {
            throw new Meteor.Error('Time entry\'s user id doesn\'t not match yours');
        }
        TimeEntries.remove(timeEntry);

        if (Meteor.isServer) {
          import { subtractTrackValue } from '/imports/api/timeEntriesCalculations/server';
          subtractTrackValue(timeEntry);
        }
    }
});


/**
 * Check, whether was taken screenshot for current time interval
 * @param {string} timeEntryId - id of timeEntry, for which screenshot should be taken
 */
export const checkIfScreenshotNeeded = new ValidatedMethod({
    name: 'checkIfScreenshotNeeded',
    validate: new SimpleSchema({
        timeEntryId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({timeEntryId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('checkIfScreenshotNeeded.notLoggedIn',
                'Must be authorized!');
        }
        let timeEntry = TimeEntries.findOne(timeEntryId);
        if (!timeEntry) {
            throw new Meteor.Error('checkIfScreenshotNeeded.notFoundEntry', 'Time entry not found')
        }
        if (timeEntry.userId != userId) {
            throw new Meteor.Error('checkIfScreenshotNeeded.notEntryOwner', 'Time entry\'s user id doesn\'t not match yours');
        }
        let getCurrentTimeBlockStartTime = function (timeEntryStartMoment) {
            const SCREENSHOT_TIME_INTERVAL = 10; // minutes
            let currentIntervalStartMoment = moment(
                timeEntryStartMoment);
            let currentMoment = moment();

            while (currentIntervalStartMoment < currentMoment) {
                currentIntervalStartMoment.add(
                    SCREENSHOT_TIME_INTERVAL, 'minutes');
            }

            currentIntervalStartMoment.subtract(
                SCREENSHOT_TIME_INTERVAL, 'minutes');
            return currentIntervalStartMoment.toDate();
        };
        let timeEntryStartMoment = moment(timeEntry.startDate);
        let currentTimeIntervalStartsAt =
            getCurrentTimeBlockStartTime(timeEntryStartMoment);

        let screenshot = Screenshots.findOne({
                createdAt: {
                    $gte: currentTimeIntervalStartsAt
                }
            });

        // if screenshot was found, returns false, if not, returns true
        return !screenshot;
    }
});

/**
 * Upload taken screenshot to Google Storage
 * @param {object} screenshotParams - object, with screenshot params, and arraybuffer
 */
//TODO: NEED TO REFACTOR AFTER APP IS DONE !!!!!!!!!!!!!!!!!!!!!!!
export const uploadTakenScreenshot = new ValidatedMethod({
    name: 'uploadTakenScreenshot',
    validate: null,
    run(screenhotToUpload) {
        let timeEntry = TimeEntries.findOne({_id: screenhotToUpload.timeEntryId});
        if (!timeEntry) {
            throw new Meteor.Error('invalid-data-error', 'Time entry not found');
        }
        let userId = timeEntry.userId;

        let isWasUploadedBefore = Screenshots.findOne({_id: screenhotToUpload._id});
        if (!!isWasUploadedBefore) {
            throw new Meteor.Error('screenshot-already-exist-error', 'This screenshot is already exists!');
        }
        screenhotToUpload.userId = userId;
        const mediaLink = uploadPhoto.call(screenhotToUpload);

        const id = Screenshots.insert({
            _id: screenhotToUpload._id,
            timeEntryId: screenhotToUpload.timeEntryId,
            screenshotOriginalURL: mediaLink,
            screenshotThumbnailPreviewURL: mediaLink,
            takenAt: screenhotToUpload.takenAt || new Date(),
            uploadedAt: new Date(),
            keyEvents: screenhotToUpload.keyEvents,
            mouseEvents: screenhotToUpload.mouseEvents
        });
        return id;
    }
});

/**
 * Adding manual time
 * @param {object} params - object, with time params
 * @param {date} params.startDate - start date of adding time
 * @param {date} params.endDate - end date of adding time
 * @param {string} params.message - message(title) of adding time
 * @param {string} params.projectId - id of project, for which time is added
 */
// TODO if this method still in use?
export const addManualTime = new ValidatedMethod({
    name: 'addManualTime',
    validate: new SimpleSchema({
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        minutes: {
            type: Number
        },
        message: {
            type: String
        },
        projectId: {
            type: Number,
            regEx: SimpleSchema.RegEx.Id
        },
        tags: {
            type: [String]
        }
    }).validator(),
    run(params) {
        const userId = this.userId;

        if (!userId) {
            throw new Meteor.Error('addManualTime.notLoggedIn',
                'Add manual time may only authorized user!');
        }
        let timeEntry = {
            _done: true,
            _isActive: false,
            _isManual: true,
            _totalMinutes: params.minutes,
            _initiatedByDesktopApp: false,
            _trackedByDesktopApp: false,

            userId: userId,
            // TODO taskId missing
            startDate: params.startDate,
            endDate: params.endDate,
            message: params.message,
            projectId: params.projectId,
            tags: params.tags
        };

        TimeEntries.insert(timeEntry, function (error) {
            if (!error) {
                //-------------------NOTIFICATIONS SENDING----------------------------
                let user = Meteor.users.findOne({_id: userId});
                let project = Projects.findOne({_id: params.projectId});
                let query = {};
                query['roles.' + params.projectId] = {$in: ['project-manager', 'project-admin']};
                let managersAndAdmins = Meteor.users.find(query).fetch();
                managersAndAdmins = _.map(managersAndAdmins, function (doc) {
                    return doc._id;
                });
                managersAndAdmins.push(userId);
                managersAndAdmins = _.uniq(managersAndAdmins);

                let msg = 'Timetracker - added manual hours by user ' + user.profile.fullName + ' for project ' + project.name;
                sendNotifications.call({
                    title: 'Added manual hours',
                    msg: msg,
                    usersIdsArray: managersAndAdmins.ownerId
                });

                // updating project info
                const contract = Contracts.findOne({projectIds: params.projectId});
                if (contract && contract.status === 'active') {
                    const timeEntryWithContract = Object.assign(timeEntry, {
                       contractId: contract._id
                    });
                    if (Meteor.isServer) {
                      import { addTrackValue } from '/imports/api/timeEntriesCalculations/server';
                      addTrackValue(timeEntryWithContract);
                    }
                }
            } else {
                console.log(error);
                throw new Meteor.Error('addManualTime.addingFail', 'Fail adding manual time');
            }
        });
    }
});

export const markTimeEntryAsTrackedByApp = new ValidatedMethod({
    name: 'markTimeEntryAsTrackedByApp',
    validate: new SimpleSchema({
        timeEntryId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({timeEntryId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('markTimeEntryAsTrackedByApp.notLoggedIn',
                'You should be logged in to perform this action!');
        }
        let entry = TimeEntries.findOne(timeEntryId);
        if (!entry || userId != entry.userId) {
            throw new Meteor.Error('permission-error', 'Time entry\'s user id doesn\'t not match yours');
        }

        return TimeEntries.update(timeEntryId, {
            $set: {
                _trackedByDesktopApp: true
            }
        });
    }
});

export const syncTimeEntry = new ValidatedMethod({
    name: 'syncTimeEntry',
    validate: null,
    run(timeEntry) {
        const userId = this.userId;
        let id;
        if (!userId) {
            throw new Meteor.Error('syncTimeEntry.notLoggedIn',
                'You should be logged in to perform this action!');
        }
        let sameEntry = TimeEntries.findOne({_id: timeEntry._id});

        if (_.isDate(timeEntry.endDate)) {
            timeEntry._totalMinutes = moment(timeEntry.endTime).diff(timeEntry.startTime, 'm');
        }

        if (!!sameEntry) {
            TimeEntries.update(sameEntry._id, {$set: timeEntry});
        } else {
            id = TimeEntries.insert(timeEntry);
        }

        return id || sameEntry._id;

    }
});

export const syncTimeEntries = new ValidatedMethod({
    name: 'syncTimeEntries',
    validate: null,

    run({ timeEntriesToSync, clientUserId }) {
        const userId = clientUserId ? clientUserId : this.userId;
        return _.map(timeEntriesToSync, function (timeEntry) {
            if (timeEntry.userId != userId) {

                return {
                    timeEntryInfo: {
                        startDate: timeEntry.startDate,
                        projectId: timeEntry.projectId,
                        taskId: timeEntry.taskId,
                        message: timeEntry.message,
                        userId: userId,
                        countKeyboardEvents: timeEntry.countKeyboardEvents,
                        countMouseEvents: timeEntry.countMouseEvents,
                        countEventsPerMin: timeEntry.countEventsPerMin

                    },
                    error: 'permission-error'
                }
            } else {
                let id = syncTimeEntry.call(timeEntry);
                if (id) {
                    return {
                        timeEntryInfo: {
                            _id: id,
                            startDate: timeEntry.startDate,
                            projectId: timeEntry.projectId,
                            taskId: timeEntry.taskId,
                            message: timeEntry.message,
                            userId: userId,
                            countKeyboardEvents: timeEntry.countKeyboardEvents,
                            countMouseEvents: timeEntry.countMouseEvents,
                            countEventsPerMin: timeEntry.countEventsPerMin
                        }
                    }
                }
            }
        });
    }
});

export const syncTimeEntriesImproved = new ValidatedMethod({
   name: 'syncTimeEntriesImproved',
    validate: null,
    run({ userId, timeEntries }) {
        const desktopUserId = userId ? userId : this.userId;
        if(!desktopUserId) {
            throw new Meteor.Error('syncTimeEntriesImproved.notLoggedIn',
              'You should be logged in to perform this action');
        }
        const userTE = timeEntries.filter(te => te.userId === desktopUserId);
        const differentUserTE = timeEntries.filter(te => te.userId !== desktopUserId);
        const syncedUserTE = userTE.map(te => {
            const oldTE = TimeEntries.findOne(te._id);
            if (!!oldTE) {
                if (oldTE._isActive === true && te._isActive === false) {
                    if (Meteor.isServer) {
                      import { addTrackValue } from '/imports/api/timeEntriesCalculations/server';
                      addTrackValue(te);
                    }
                } else if (oldTE._isActive === false && te._isActive === false) {
                    if (oldTE.startDate !== te.startDate || oldTE.endDate !== te.endDate) {
                        if (Meteor.isServer) {
                          import { updateTrackValue } from '/imports/api/timeEntriesCalculations/server';
                          updateTrackValue(oldTE, te.startDate, te.endDate);
                        }
                    }

                }
                TimeEntries.update(te._id, {$set: te});
            } else {
                if (te._isActive === false) {
                    if (Meteor.isServer) {
                      import { addTrackValue } from '/imports/api/timeEntriesCalculations/server';
                      addTrackValue(te);
                    }
                }
                TimeEntries.insert(te);
            }
            return te._id;
        });
        return {
            differentUserTE,
            syncedUserTE
        };
    }
});

export const checkIsExistActiveTimeEntry = new ValidatedMethod({
    name: 'checkIsExistActiveTimeEntry',
    validate: new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({userId}) {
        if (!userId) {
            throw new Meteor.Error('checkIsExistActiveTimeEntry.notLoggedIn',
                'User not found!');
        }
        return TimeEntries.findOne({_isActive: true, userId: userId});
    }
});

export const clientStopTracking = new ValidatedMethod({
    name: 'clientStopTracking',
    validate: new SimpleSchema({
        entryId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        },
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({userId, entryId}) {
        let userId1 = userId || this.userId;
        if (!userId1) {
            throw new Meteor.Error('clientStopTracking.notLoggedIn',
                'Only authorized users can stop time tracking!');
        }
        return stopTracking.call({entryId: entryId, userId: userId1});
    }
});

export const pingServer = new ValidatedMethod({
    name: 'pingServer',
    validate: null,
    run() {
        return true;
    }
});

export const updateTimeEntry = new ValidatedMethod({
  name: 'updateTimeEntry',
  validate: null,
  run({ userId, timeEntry }) {
    if(!userId) {
      throw new Meteor.Error('updateTimeEntry.notLoggedIn',
        'You should be logged in no perform this action');
    } else if(!timeEntry) {
      throw new Meteor.Error('updateTimeEntry.dataNotSpecified',
        'Time entry not specified');
    }  else {
      const foundTE = TimeEntries.findOne(timeEntry._id);
      if (foundTE._isActive === true && timeEntry._isActive == false) {
        if (Meteor.isServer) {
          import { addTrackValue } from '/imports/api/timeEntriesCalculations/server';
          addTrackValue(timeEntry);
        }
      } else if (foundTE._isActive === false && timeEntry._isActive === false) {
        if (foundTE.startDate !== timeEntry.startDate || foundTE.endDate !== timeEntry.endDate) {
          if (Meteor.isServer) {
            import { updateTrackValue } from '/imports/api/timeEntriesCalculations/server';
            updateTrackValue(foundTE, timeEntry.startDate, timeEntry.endDate);
          }
        }
      }
      TimeEntries.update(timeEntry._id, {$set: timeEntry});
    }
  }
});
