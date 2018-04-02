import moment from 'moment';
import { TimeEntries } from '/imports/api/timeEntries/timeEntries.js';
import { Projects } from '/imports/api/projects/projects.js';
import { Tasks } from '/imports/api/tasks/tasks.js';
import { Contracts } from '/imports/api/contracts/contracts.js';
import { oneHour } from './helpers/index';

class Summarizer {
  constructor () {
    this.userIds = [];
    this.timeEntriesQuery = undefined;
    this.itemIds = [];
    this.itemIdFieldName = '';
    this.excludedProjects = [];
    this.excludedTasks = [];
  }

  _findDocumentsWithoutTrackingInfo () {
    const projects = Projects.find({ trackingInfo: { $exists: false } }).fetch();
    const contracts = Contracts.find().fetch();
    const tasks = Tasks.find({ trackingInfo: { $exists: false } }).fetch();

    let trackingInfo = {
      allUsers: {
        allTime: { tracked: 0, earned: 0 },
        lastMonth: { tracked: 0, earned: 0 },
        thisMonth: { tracked: 0, earned: 0 },
        lastWeek: { tracked: 0, earned: 0 },
        thisWeek: { tracked: 0, earned: 0 },
        yesterday: { tracked: 0, earned: 0 },
        today: { tracked: 0, earned: 0 }
      },
      individual: []
    };

    for (let i = 0; i < projects.length; i++) {
      Projects.update(projects[ i ]._id, { $set: { trackingInfo } });
    }

    for (let i = 0; i < tasks.length; i++) {
      Tasks.update(tasks[ i ]._id, { $set: { trackingInfo } });
    }

    trackingInfo = {
      allTime: [],
      thisWeek: { tracked: 0, earned: 0 },
      thisMonth: { tracked: 0, earned: 0 }
    };

    for (let i = 0; i < contracts.length; i++) {
      if (!contracts[i].trackingInfo) {
        Contracts.update(contracts[i]._id, { $set: { trackingInfo } });
      } else if (!contracts[i].trackingInfo.thisMonth) {
        const updatedTrackingInfo = contracts[i].trackingInfo;
        updatedTrackingInfo.thisMonth = { tracked: 0, earned: 0 };
        updatedTrackingInfo.thisWeek = { tracked: 0, earned: 0 };
        Contracts.update(contracts[i]._id, { $set: { trackingInfo: updatedTrackingInfo } });
      }
    }
  }

  calculateActualState() {
    this._findDocumentsWithoutTrackingInfo();
    const users = Meteor.users.find({ 
      'profile.isArchived': false,
      'profile.isBlocked': false 
    }, { fields: { _id: 1} }).fetch();
    this.userIds = users.map(user => user._id);
    const allTracks = this._calculateForAll();
    const individualTracks = this._calculateForEach();
    this._saveInContracts(individualTracks);
    this._saveInProjects(allTracks, individualTracks);
    this._saveInTasks(allTracks, individualTracks);
    this.calculateEarnedAndTrackedForEachUser();
  }

  calculateEarnedAndTrackedForEachUser() {
    const users = Meteor.users.find({
      'profile.isArchived': false,
      'profile.isBlocked': false
    }).fetch();

    for (let i = 0; i < users.length; i++) {
      let hours = 0;
      let earned = 0;
      let projects = Projects.find({assignedUsersIds: users[i]._id}, { fields: { trackingInfo: 1 } }).fetch();
      for (let j = 0; j < projects.length; j++) {
        let individual = projects[j].trackingInfo.individual;
        for (let x = 0; x < individual.length; x++) {
          if (individual[x].userId === users[i]._id) {
            hours += individual[x].allTime.tracked / (3600 * 1000);
            earned += individual[x].allTime.earned;
          }
        }
      }
      Meteor.users.update(users[i]._id, { $set: {'profile.hours': parseInt(hours), 'profile.earned': parseInt(earned)}});
    }
  }

  _calculateForAll() {
    const projectsAllTracking = this._calculateTrackingProjectsAll();
    const tasksAllTracking = this._calculateTrackingTasksAll();
    return {
      projectsAllTracking,
      tasksAllTracking
    };
  }

  _calculateForEach() {
    return this.userIds.map(userId => {
      return {
        userId,
        projectsTracking: this._calculateTrackingProjects(userId),
        tasksTracking: this._calculateTrackingTasks(userId)
      }
    });
  }

  _saveInProjects(allTracks, individualTracks) {
    const projects = Projects.find({}, { fields: { trackingInfo: 1 } }).fetch();
    projects.forEach(project => {
      const trackingInfo = {};
      trackingInfo.allUsers = filterProjectTracks(allTracks.projectsAllTracking);

      const individual = [];
      individualTracks.forEach(userTrack => {
        const userProjectsTracking = userTrack.projectsTracking;
        const filteredTracks = filterProjectTracks(userProjectsTracking);
        if (filteredTracks.allTime.tracked > 0) {
          individual.push(filteredTracks);
        }
      });
      trackingInfo.individual = individual;
      Projects.update(project._id, { $set: { trackingInfo } });

      function filterProjectTracks (tracking) {
        const result = {... tracking};
        const keys = Object.keys(tracking);
        keys.forEach(key => {
          if (key === 'userId') return;
          result[key] = tracking[key].find(track => track.projectId === project._id) || { tracked: 0, earned: 0 };
          delete result[key].projectId;
        });
        return result;
      }
    });
  }

  _saveInTasks(allTracks, individualTracks) {
    const tasks = Tasks.find({}, { fields: { trackingInfo: 1 } }).fetch();
    tasks.forEach(task => {
      const trackingInfo = {};
      trackingInfo.allUsers = filterTasksTracks(allTracks.tasksAllTracking);

      const individual = [];
      individualTracks.forEach(userTrack => {
        const userTasksTracking = userTrack.tasksTracking;
        const filteredTracks = filterTasksTracks(userTasksTracking);
        if (filteredTracks.allTime.tracked > 0) {
          individual.push(filteredTracks);
        }
      });
      trackingInfo.individual = individual;
      Tasks.update(task._id, { $set: { trackingInfo } });

      function filterTasksTracks (tracking) {
        const result = {... tracking};
        const keys = Object.keys(tracking);
        keys.forEach(key => {
          if (key === 'userId') return;
          result[key] = tracking[key].find(track => track.taskId === task._id) || { tracked: 0, earned: 0 };
          delete result[key].taskId;
        });
        return result;
      }
    });
  }

  _saveInContracts(projectTracks) {
    this.userIds.forEach(userId => {
      const userTracks = projectTracks.find(track => track.userId === userId);
      const userProjectTracks = userTracks.projectsTracking.allTime;
      const thisMonthProjectTracks = userTracks.projectsTracking.thisMonth;
      const thisWeekProjectTracks = userTracks.projectsTracking.thisWeek;
      const contracts = Contracts.find({
        workerId: userId
      }, { fields: { trackingInfo: 1, projectIds: 1 }}).fetch();
      contracts.forEach(contract => {
        const contractProjects = userProjectTracks.filter(track => {
          return contract.projectIds.includes(track.projectId);
        });
        const contractThisMonthProjects = thisMonthProjectTracks.filter(track => {
          return contract.projectIds.includes(track.projectId);
        });
        const contractThisWeekProjects = thisWeekProjectTracks.filter(track => {
          return contract.projectIds.includes(track.projectId);
        });
        const thisMonthInfo = contractThisMonthProjects.reduce((currValue, track) => {
          const updatedValue = { ...currValue };
          updatedValue.tracked += track.tracked;
          updatedValue.earned += track.earned;
          return updatedValue;
        }, { tracked: 0, earned: 0 });
        const thisWeekInfo = contractThisWeekProjects.reduce((currValue, track) => {
          const updatedValue = { ...currValue };
          updatedValue.tracked += track.tracked;
          updatedValue.earned += track.earned;
          return updatedValue;
        }, { tracked: 0, earned: 0 });
        const trackingInfo = {
          allTime: contractProjects,
          thisMonth: thisMonthInfo,
          thisWeek: thisWeekInfo
        };
        Contracts.update(contract._id, { $set: { trackingInfo } });
      });
    });
  }

  _calculateTrackingProjectsAll () {
    const projects = Projects.find({}, { fields: { _id: 1 } }).fetch();
    const projectIds = projects.map(project => project._id);
    const chain = () => this._clearQuery()._projects(projectIds);
    const allTime = chain()._allTime()._calculate();
    allTime.forEach(itemCalculatedData => {
      // TODO add check that results not changed in respect to already counted
      if (itemCalculatedData.tracked === 0) {
        this.excludedProjects.push(itemCalculatedData.projectId);
      }
    });
    return {
      allTime,
      lastMonth: chain()._lastMonth()._calculate(),
      thisMonth: chain()._thisMonth()._calculate(),
      lastWeek: chain()._lastWeek()._calculate(),
      thisWeek: chain()._thisWeek()._calculate(),
      yesterday: chain()._yesterday()._calculate(),
      today: chain()._today()._calculate()
    };
  }

  _calculateTrackingTasksAll() {
    const tasks = Tasks.find({
      projectId: {
        $nin: this.excludedProjects
      }
    }, { fields: { _id: 1 } }).fetch();
    const taskIds = tasks.map(task => task._id);
    const chain = () => this._clearQuery()._tasks(taskIds);
    const allTime = chain()._allTime()._calculate();
    allTime.forEach(itemCalculatedData => {
      // TODO add check that results not changed in respect to already counted
      if (itemCalculatedData.tracked === 0) {
        this.excludedTasks.push(itemCalculatedData.taskId);
      }
    });
    return {
      allTime,
      lastMonth: chain()._lastMonth()._calculate(),
      thisMonth: chain()._thisMonth()._calculate(),
      lastWeek: chain()._lastWeek()._calculate(),
      thisWeek: chain()._thisWeek()._calculate(),
      yesterday: chain()._yesterday()._calculate(),
      today: chain()._today()._calculate()
    };
  }

  _calculateTrackingProjects(userId) {
    const projects = Projects.find({
      _id: {
        $nin: this.excludedProjects
      },
      assignedUsersIds: userId
    }, { fields: { _id: 1 } }).fetch();
    const projectIds = projects.map(project => project._id);
    const chain = () => this._clearQuery()._projects(projectIds)._user(userId);
    return {
      userId,
      allTime: chain()._allTime()._calculate(),
      lastMonth: chain()._lastMonth()._calculate(),
      thisMonth: chain()._thisMonth()._calculate(),
      lastWeek: chain()._lastWeek()._calculate(),
      thisWeek: chain()._thisWeek()._calculate(),
      yesterday: chain()._yesterday()._calculate(),
      today: chain()._today()._calculate()
    };
  };

  _calculateTrackingTasks(userId) {
    const tasks = Tasks.find({
      _id: {
        $nin: this.excludedTasks
      },
      projectId: {
        $nin: this.excludedProjects
      },
      membersIds: userId
    }, { fields: { _id: 1 } }).fetch();
    const taskIds = tasks.map(task => task._id);
    const chain = () => this._clearQuery()._tasks(taskIds)._user(userId);
    return {
      userId,
      allTime: chain()._allTime()._calculate(),
      lastMonth: chain()._lastMonth()._calculate(),
      thisMonth: chain()._thisMonth()._calculate(),
      lastWeek: chain()._lastWeek()._calculate(),
      thisWeek: chain()._thisWeek()._calculate(),
      yesterday: chain()._yesterday()._calculate(),
      today: chain()._today()._calculate()
    };
  }

  _clearQuery() {
    this.timeEntriesQuery = {
      _isActive:false,
      _done: true
    };
    return this;
  }

  _projects(projectIds) {
    this.itemIds = projectIds;
    this.itemIdFieldName = 'projectId';
    return this;
  }

  _tasks(taskIds) {
    this.itemIds = taskIds;
    this.itemIdFieldName = 'taskId';
    return this;
  }

  _user(userId) {
    this.timeEntriesQuery.userId = userId;
    return this;
  }

  _today() {
    const today = moment().startOf('day');
    this.timeEntriesQuery.startDate = { $gte: today.toDate() };
    return this;
  }

  _yesterday() {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    this.timeEntriesQuery.startDate = { $gte: yesterday.toDate(), $lt: today.toDate() };
    return this;
  }

  _thisWeek() {
    const startWeek = moment().startOf('isoweek');
    const endWeek = moment().startOf('isoweek').add(1, 'week');
    this.timeEntriesQuery.startDate = { $gte: startWeek.toDate(), $lt: endWeek.toDate() };
    return this;
  }

  _lastWeek() {
    const startWeek = moment().subtract(1, 'week').startOf('isoweek');
    const endWeek = moment().startOf('isoweek');
    this.timeEntriesQuery.startDate = { $gte: startWeek.toDate(), $lt: endWeek.toDate() };
    return this;
  }

  _thisMonth() {
    const startMonth = moment().startOf('month');
    const endMonth = moment().add(1, 'month').startOf('month');
    this.timeEntriesQuery.startDate = { $gte: startMonth.toDate(), $lt: endMonth.toDate() };
    return this;
  }

  _lastMonth() {
    const startMonth = moment().subtract(1, 'month').startOf('month');
    const endMonth = moment().startOf('month');
    this.timeEntriesQuery.startDate = { $gte: startMonth.toDate(), $lt: endMonth.toDate() };
    return this;
  }

  _allTime() {
    return this;
  }

  _calculate() {
    return this.itemIds.map(itemId => {
      this.timeEntriesQuery[this.itemIdFieldName] = itemId;
      const accumulatorObject = { tracked: 0, earned: 0 };
      accumulatorObject[this.itemIdFieldName] = itemId;
      if (this.excludedProjects.includes(itemId) || this.excludedTasks.includes(itemId)) {
        return accumulatorObject;
      }
      const timeEntries = TimeEntries.find(this.timeEntriesQuery, {
        fields: {
          startDate: 1,
          endDate: 1,
          paymentType: 1,
          paymentRate: 1,
          workingDaysThisMonth: 1,
          workingTimeLeft: 1
        }
      }).fetch();
      return timeEntries.reduce((trackedTimeAndIncome, timeEntry) => {
        const difference = timeEntry.endDate - timeEntry.startDate;
        const rate = timeEntry.paymentRate || 0;
        trackedTimeAndIncome.tracked += difference;
        if (timeEntry.paymentType === 'hourly') {
          trackedTimeAndIncome.earned += (rate / oneHour) * difference;
        } else if (timeEntry.paymentType === 'monthly') {
          let differenceComplete;
          const factor = timeEntry.workingTimeLeft / difference;
          if (factor > 1) {
            differenceComplete = difference;
          } else {
            differenceComplete = difference * factor;
          }
          const workingTimeThisMonth = timeEntry.workingDaysThisMonth * 8 * oneHour;
          trackedTimeAndIncome.earned += (rate / workingTimeThisMonth) * differenceComplete;
        } else if (timeEntry.paymentType === 'fixed') {
          trackedTimeAndIncome.earned = 0;
        } else {
          // console.error(`unknown payment type ${timeEntry.paymentType} for timeEntry ${timeEntry._id}`);
          trackedTimeAndIncome.earned = 0;
        }
        return trackedTimeAndIncome;
      }, accumulatorObject);
    });
  }
}

const summarizer = new Summarizer();
// summarizer.calculateActualState();

export default summarizer;
