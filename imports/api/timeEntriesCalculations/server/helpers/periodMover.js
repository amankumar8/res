import { Projects } from '/imports/api/projects/projects.js';
import { Tasks } from '/imports/api/tasks/tasks.js';
import { Contracts } from '/imports/api/contracts/contracts.js';

export const periodMover = function () {
  findDocumentsWithoutTrackingInfo();
  const periodsToMove = _getPeriodsToMoveToday();
  _moveProjects(periodsToMove);
  _moveTasks(periodsToMove);
  _resetContracts(periodsToMove);
};

function findDocumentsWithoutTrackingInfo() {
  const projects = Projects.find( { trackingInfo : { $exists : false } } ).fetch();
  const tasks = Tasks.find( { trackingInfo : { $exists : false } } ).fetch();

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
        Projects.update(projects[i]._id, { $set: { trackingInfo } });
      }

      for (let i = 0; i < tasks.length; i++) {
        Tasks.update(tasks[i]._id, { $set: { trackingInfo } });
      }
}

export const _getPeriodsToMoveToday = function () {
  const result = ['today'];
  if (_isNewWeek()) {
    result.push('thisWeek');
  }
  if (_isNewMonth()) {
    result.push('thisMonth');
  }
  return result;
};

export const _isNewWeek = function () {
  let date = new Date;
  if (date.getDay() === 1) {
    return true;
  } else {
    return false;
  }
};

export const _isNewMonth = function () {
    let date = new Date;
    if (date.getDate() === 1) {
        return true;
    } else {
        return false;
    }
};

export const _moveProjects = function (periodsToMove) {
  const projectsToUpdate = Projects.find({}, { fields: { trackingInfo: 1 } }).fetch();
  projectsToUpdate.forEach(project => {
    let trackingInfo = { ...project.trackingInfo };
    trackingInfo = _moveAllUserTracks(trackingInfo, periodsToMove);
    trackingInfo = _moveIndividualTracks(trackingInfo, periodsToMove);
    Projects.update(project._id, { $set: { trackingInfo } });
  });
};

export const _moveTasks = function (periodsToMove) {
  let tasksToUpdate = Tasks.find({}, { fields: { trackingInfo: 1 } }).fetch();
  tasksToUpdate.forEach(task => {
    let trackingInfo = { ...task.trackingInfo };
    trackingInfo = _moveAllUserTracks(trackingInfo, periodsToMove);
    trackingInfo = _moveIndividualTracks(trackingInfo, periodsToMove);
    Tasks.update(task._id, { $set: { trackingInfo } });
  });
};

export const _resetContracts = function (periodsToMove) {
  const contractsToUpdate = Contracts.find({}, { fields: { trackingInfo: 1 } }).fetch();
  contractsToUpdate.forEach(contract => {
    const trackingInfo = { ...contract.trackingInfo };
    if (periodsToMove.includes('thisWeek')) {
      trackingInfo.thisWeek = { tracked: 0, earned: 0 };
    }
    if (periodsToMove.includes('thisMonth')) {
      trackingInfo.thisMonth = { tracked: 0, earned: 0 };
    }
    Contracts.update({ _id: contract._id }, { $set: { trackingInfo } });
  });
};

export const _moveAllUserTracks = function (trackingInfo, periodsToMove) {
  const allUsers = { ...trackingInfo.allUsers };
  const individual = trackingInfo.individual.map(track => ({ ...track }));
  const result =  { allUsers, individual };
  if (periodsToMove.includes('thisWeek')) {
    result.allUsers.lastWeek = result.allUsers.thisWeek;
    result.allUsers.thisWeek = { tracked: 0, earned: 0 };
  }
  if (periodsToMove.includes('thisMonth')) {
    result.allUsers.lastMonth = result.allUsers.thisMonth;
    result.allUsers.thisMonth = { tracked: 0, earned: 0 };
  }
  result.allUsers.yesterday = result.allUsers.today;
  result.allUsers.today = { tracked: 0, earned: 0 };
  return result;
};

export const _moveIndividualTracks = function (trackingInfo, periodsToMove) {
  const allUsers = { ...trackingInfo.allUsers };
  const individual = trackingInfo.individual.map(track => ({ ...track }));
  const result =  { allUsers, individual };
  result.individual.map(userTrack => {
    if (periodsToMove.includes('thisWeek')) {
      userTrack.lastWeek = userTrack.thisWeek;
      userTrack.thisWeek = { tracked: 0, earned: 0 };
    }
    if (periodsToMove.includes('thisMonth')) {
      userTrack.lastMonth = userTrack.thisMonth;
      userTrack.thisMonth = { tracked: 0, earned: 0 };
    }
    userTrack.yesterday = userTrack.today;
    userTrack.today = { tracked: 0, earned: 0 };
    return userTrack;
  });
  return result;
};
