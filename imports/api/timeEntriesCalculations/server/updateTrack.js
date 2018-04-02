import { Projects } from '/imports/api/projects/projects.js';
import { Tasks } from '/imports/api/tasks/tasks.js';
import { Contracts } from '/imports/api/contracts/contracts.js';
import { oneHour } from './helpers/index';

export const addTrackValue = function (timeEntry) {
  const tracked = timeEntry.endDate - timeEntry.startDate;
  let earned;
  if(timeEntry.paymentType === 'hourly') {
    earned = (timeEntry.paymentRate / oneHour) * tracked;
  } else if (timeEntry.paymentType === 'monthly') {
    let differenceComplete;
    const factor = Math.abs(timeEntry.workingTimeLeft / tracked);
    if (factor > 1) {
      differenceComplete = tracked;
    } else {
      differenceComplete = tracked * factor;
    }
    const workingTimeThisMonth = timeEntry.workingDaysThisMonth * 8 * oneHour;
    earned = (timeEntry.paymentRate / workingTimeThisMonth) * differenceComplete;
  } else if (timeEntry.paymentType === 'fixed') {
    earned = 0;
  } else {
    // console.error(`unknown payment type ${timeEntry.paymentType} for timeEntry ${timeEntry._id}`);
    earned = 0;
  }
  const data = _prepareData(timeEntry, tracked, earned);
  _updateDocuments(data);
};

export const subtractTrackValue = function (timeEntry) {
  const tracked = timeEntry.startDate - timeEntry.endDate;
  let earned;
  if (timeEntry.paymentType === 'hourly') {
    earned = (timeEntry.paymentRate / oneHour) * tracked;
  } else if (timeEntry.paymentType === 'monthly') {
    let differenceComplete;
    const factor = Math.abs(timeEntry.workingTimeLeft / tracked);
    if (factor > 1) {
      differenceComplete = tracked;
    } else {
      differenceComplete = tracked * factor;
    }
    const workingTimeThisMonth = timeEntry.workingDaysThisMonth * 8 * oneHour;
    earned = (timeEntry.paymentRate / workingTimeThisMonth) * differenceComplete;
  } else if (timeEntry.paymentType === 'fixed') {
    earned = 0;
  } else {
    // console.error(`unknown payment type ${timeEntry.paymentType} for timeEntry ${timeEntry._id}`);
    earned = 0;
  }
  const data = _prepareData(timeEntry, tracked, earned);
  _updateDocuments(data);
};

export const updateTrackValue = function (timeEntry, newStartDate, newEndDate) {
  subtractTrackValue(timeEntry);
  const updatedTimeEntry = Object.assign(timeEntry, {
    startDate: newStartDate,
    endDate: newEndDate
  });
  addTrackValue(updatedTimeEntry);
};

export const _prepareData = function (timeEntry, tracked, earned) {
  const period = _getTimePeriod(timeEntry.startDate);
  return {
    trackingData: {
      tracked,
      earned,
      period
    },
    contractInfo: {
      _id: timeEntry.contractId,
      projectId: timeEntry.projectId
    },
    projectInfo: {
      _id: timeEntry.projectId,
      userId: timeEntry.userId
    },
    taskInfo: {
      _id: timeEntry.taskId,
      userId: timeEntry.userId
    }
  };
};

export const _getTimePeriod = function (date) {
  if (isToday(date)) {
    return ['today', 'thisWeek', 'thisMonth'];
  } else if (isYesterday(date) && isThisWeek(date) && isThisMonth(date)) {
    return ['yesterday', 'thisWeek', 'thisMonth'];
  } else if (isYesterday(date) && isThisWeek(date) && isLastMonth(date)) {
    return ['yesterday', 'thisWeek', 'lastMonth'];
  } else if (isYesterday(date) && isLastWeek(date) && isThisMonth(date)) {
    return ['yesterday', 'lastWeek', 'thisMonth'];
  } else if (isYesterday(date) && isLastWeek(date) && isLastMonth(date)) {
    return ['yesterday', 'lastWeek', 'lastMonth'];
  } else if (isThisWeek(date) && isThisMonth(date)) {
    return ['thisWeek', 'thisMonth'];
  } else if (isThisWeek(date) && isLastMonth(date)) {
    return ['thisWeek', 'lastMonth'];
  } else if (isLastWeek(date) && isThisMonth(date)) {
    return ['lastWeek', 'thisMonth'];
  } else if (isLastWeek(date) && isLastMonth(date)) {
    return ['lastWeek', 'lastMonth'];
  } else if (isThisMonth(date)) {
    return ['thisMonth'];
  } else if (isLastMonth(date)) {
    return ['lastMonth'];
  }
  return ['allTime'];
};

export const isToday = function (date) {
  return date >= moment().startOf('day') && date <= moment().endOf('day');
};

export const isYesterday = function (date) {
  return date >= moment().subtract(1, 'day').startOf('day') &&
         date < moment().startOf('day');
};

export const isThisWeek = function (date) {
  return date >= moment().startOf('isoweek') && date <= moment().endOf('isoweek');
};

export const isLastWeek = function (date) {
  return date >= moment().subtract(1, 'week').startOf('isoweek') &&
         date < moment().startOf('isoweek');
};

export const isThisMonth = function (date) {
  return date >= moment().startOf('month') && date <=moment().endOf('month');
};

export const isLastMonth = function (date) {
  return date >= moment().subtract(1, 'month').startOf('month') &&
         date < moment().startOf('month');
};

export const _updateDocuments = function (data) {
  _updateContract(data.contractInfo, data.trackingData);
  _updateProject(data.projectInfo, data.trackingData);
  _updateTask(data.taskInfo, data.trackingData);
};

export const _updateContract = function (contractInfo, trackingData) {
  const contract = Contracts.findOne({ _id: contractInfo._id }, {
    fields: { trackingInfo: 1, paymentInfo: 1, workingTimeLeft: 1 }
  });
  if (!contract) {
    return;
  }
  let trackingInfo = contract.trackingInfo;
  if (!trackingInfo) {
    trackingInfo = { allTime: [], thisMonth: { tracked: 0, earned: 0 } };
  }
  if (!trackingInfo.thisMonth) {
    trackingInfo.thisMonth = { tracked: 0, earned: 0 };
    trackingInfo.thisWeek = { traked: 0, earned: 0 };
  }
  let projectIndex = trackingInfo.allTime.findIndex(track => track.projectId === contractInfo.projectId);
  if (projectIndex === -1) {
    projectIndex = trackingInfo.allTime.length;
    trackingInfo.allTime.push({
      projectId: contractInfo.projectId,
      tracked: 0,
      earned: 0
    });
  }
  trackingInfo.allTime[projectIndex].tracked += trackingData.tracked;
  trackingInfo.allTime[projectIndex].earned += trackingData.earned;
  trackingInfo.thisWeek.tracked += trackingData.tracked;
  trackingInfo.thisWeek.earned += trackingData.earned;
  trackingInfo.thisMonth.tracked += trackingData.tracked;
  trackingInfo.thisMonth.earned += trackingData.earned;
  if (contract.paymentInfo.type === 'monthly') {
    let workingTimeLeft = contract.workingTimeLeft - trackingData.tracked;
    if (workingTimeLeft < 0) {
      workingTimeLeft = 0;
    }
    Contracts.update(contractInfo._id, { $set: { trackingInfo, workingTimeLeft } });
  } else {
    const res = Contracts.update(contractInfo._id, { $set: { trackingInfo } });
  }
};

export const _updateProject = function (projectInfo, trackingData) {
  const project = Projects.findOne({ _id: projectInfo._id }, { fields: { trackingInfo: 1 } });
  if (!project) {
    return;
  }
  let trackingInfo = project.trackingInfo;
  if (!trackingInfo) {
    trackingInfo = { 
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
    }
  }
  trackingInfo = _updateTIAllUsers(trackingInfo, trackingData);
  trackingInfo = _updateTIIndividual(trackingInfo, trackingData, projectInfo.userId);
  Projects.update(projectInfo._id, { $set: { trackingInfo } });
};

export const _updateTask = function (taskInfo, trackingData) {
  const task = Tasks.findOne({ _id: taskInfo._id }, { fields: { trackingInfo: 1 } });
  if (!task) {
    return;
  }
  let trackingInfo = task.trackingInfo;
  if (!trackingInfo) {
    trackingInfo = { 
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
    }
  }
  trackingInfo = _updateTIAllUsers(trackingInfo, trackingData);
  trackingInfo = _updateTIIndividual(trackingInfo, trackingData, taskInfo.userId);
  Tasks.update(taskInfo._id, { $set: { trackingInfo } });
};

export const _updateTIAllUsers = function (trackingInfo, trackingData) {
  const updatedInfo = {...trackingInfo};
  if (trackingData.period.includes('lastMonth')) {
    updatedInfo.allUsers.lastMonth.tracked += trackingData.tracked;
    updatedInfo.allUsers.lastMonth.earned += trackingData.earned;
  }
  if (trackingData.period.includes('thisMonth')) {
    updatedInfo.allUsers.thisMonth.tracked += trackingData.tracked;
    updatedInfo.allUsers.thisMonth.earned += trackingData.earned;
  }
  if (trackingData.period.includes('lastWeek')) {
    updatedInfo.allUsers.lastWeek.tracked += trackingData.tracked;
    updatedInfo.allUsers.lastWeek.earned += trackingData.earned;
  }
  if (trackingData.period.includes('thisWeek')) {
    updatedInfo.allUsers.thisWeek.tracked += trackingData.tracked;
    updatedInfo.allUsers.thisWeek.earned += trackingData.earned;
  }
  if (trackingData.period.includes('yesterday')) {
    updatedInfo.allUsers.yesterday.tracked += trackingData.tracked;
    updatedInfo.allUsers.yesterday.earned += trackingData.earned;
  }
  if (trackingData.period.includes('today')) {
    updatedInfo.allUsers.today.tracked += trackingData.tracked;
    updatedInfo.allUsers.today.earned += trackingData.earned;
  }
  updatedInfo.allUsers.allTime.tracked += trackingData.tracked;
  updatedInfo.allUsers.allTime.earned += trackingData.earned;
  return updatedInfo;
};

export const _updateTIIndividual = function (trackingInfo, trackingData, userId) {
  const updatedInfo = {...trackingInfo};
  let userIndex = updatedInfo.individual.findIndex(track => track.userId === userId);
  if (userIndex === -1) {
    userIndex = updatedInfo.individual.length;
    updatedInfo.individual.push({
      userId,
      allTime: { tracked: 0, earned: 0 },
      lastMonth: { tracked: 0, earned: 0 },
      thisMonth: { tracked: 0, earned: 0 },
      lastWeek: { tracked: 0, earned: 0 },
      thisWeek: { tracked: 0, earned: 0 },
      yesterday: { tracked: 0, earned: 0 },
      today: { tracked: 0, earned: 0 }
    });
  }
  if (trackingData.period.includes('lastMonth')) {
    updatedInfo.individual[userIndex].lastMonth.tracked += trackingData.tracked;
    updatedInfo.individual[userIndex].lastMonth.earned += trackingData.earned;
  }
  if (trackingData.period.includes('thisMonth')) {
    updatedInfo.individual[userIndex].thisMonth.tracked += trackingData.tracked;
    updatedInfo.individual[userIndex].thisMonth.earned += trackingData.earned;
  }
  if (trackingData.period.includes('lastWeek')) {
    updatedInfo.individual[userIndex].lastWeek.tracked += trackingData.tracked;
    updatedInfo.individual[userIndex].lastWeek.earned += trackingData.earned;
  }
  if (trackingData.period.includes('thisWeek')) {
    updatedInfo.individual[userIndex].thisWeek.tracked += trackingData.tracked;
    updatedInfo.individual[userIndex].thisWeek.earned += trackingData.earned;
  }
  if (trackingData.period.includes('yesterday')) {
    updatedInfo.individual[userIndex].yesterday.tracked += trackingData.tracked;
    updatedInfo.individual[userIndex].yesterday.earned += trackingData.earned;
  }
  if (trackingData.period.includes('today')) {
    updatedInfo.individual[userIndex].today.tracked += trackingData.tracked;
    updatedInfo.individual[userIndex].today.earned += trackingData.earned;
  }
  updatedInfo.individual[userIndex].allTime.tracked += trackingData.tracked;
  updatedInfo.individual[userIndex].allTime.earned += trackingData.earned;
  return updatedInfo;
};

