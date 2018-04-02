import StubCollections from 'meteor/hwillson:stub-collections';
import { expect, sinon } from '../testSetup.js';
import * as periodMoverModule from '../../server/helpers/periodMover.js';
import { Projects } from '../../../projects/projects.js';
import { Tasks } from '../../../tasks/tasks.js';
import { oneHour } from '../../server/helpers/index';

describe('periodMover module', function () {
  beforeEach(function () {
    StubCollections.add([Projects, Tasks]);
    StubCollections.stub();
  });

  describe('periodMover function', function () {
    beforeEach(function () {
      const project = {
        _id: '1',
        trackingInfo: {
          allUsers: {
            today: { tracked: 5 * oneHour, earned: 15 },
            yesterday: { tracked: 10 * oneHour, earned: 30 },
            thisWeek: { tracked: 40 * oneHour, earned: 120 },
            lastWeek: { tracked: 45 * oneHour, earned: 150 },
            thisMonth: { tracked: 180 * oneHour, earned: 600 },
            lastMonth: { tracked: 200 * oneHour, earned: 800 }
          },
          individual: []
        }
      };
      const task = {
        _id: '2',
        trackingInfo: {
          individual: [
            {
              userId: '3',
              today: { tracked: 7 * oneHour, earned: 25 },
              yesterday: { tracked: 6 * oneHour, earned: 20 },
              thisWeek: { tracked: 35 * oneHour, earned: 120 },
              lastWeek: { tracked: 45 * oneHour, earned: 160 },
              thisMonth: { tracked: 190 * oneHour, earned: 650 },
              lastMonth: { tracked: 150 * oneHour, earned: 480 }
            }
          ]
        }
      };
      Projects.insert(project);
      Tasks.insert(task);
    });

    it('should move project tracks', function () {
      const clock = sinon.useFakeTimers(new Date('2017-05-01T00:00:00.00Z'));
      const project = Projects.findOne();

      periodMoverModule.periodMover();

      const updatedProject = Projects.findOne();
      try {
        expect(updatedProject.trackingInfo.allUsers.yesterday).to.be.deep.equal(project.trackingInfo.allUsers.today);
      } finally {
        clock.restore();
      }
    });

    it('should move task tracks', function () {
      const clock = sinon.useFakeTimers(new Date('2017-05-01T00:00:00.00Z'));
      const task = Tasks.findOne();

      periodMoverModule.periodMover();
      try {
        expect(task.trackingInfo.individual[0].lastMonth).to.be.deep.equal(task.trackingInfo.individual[0].lastMonth);
      } finally {
        clock.restore();
      }
    });

    afterEach(function () {
      Projects.remove({});
      Tasks.remove({});
    });
  });

  describe('_getPeriodsToMoveToday function', function () {
    it('should return [today] if yesterday was this week and this month', function () {
      const clock = sinon.useFakeTimers(new Date('2017-09-23T00:00:00.00Z'));

      const result = periodMoverModule._getPeriodsToMoveToday();

      try {
        expect(result).to.be.deep.equal(['today']);
      } finally {
        clock.restore();
      }
    });

    it('should return correct array if yesterday was last week and this month', function () {
      const clock = sinon.useFakeTimers(new Date('2017-09-18T00:00:00.00Z'));

      const result = periodMoverModule._getPeriodsToMoveToday();

      try {
        expect(result).to.be.deep.equal(['today', 'thisWeek']);
      } finally {
        clock.restore();
      }
    });

    it('should return correct array if yesterday was this week and last month', function () {
      const clock = sinon.useFakeTimers(new Date('2017-09-01T00:00:00.00Z'));

      const result = periodMoverModule._getPeriodsToMoveToday();

      try {
        expect(result).to.be.deep.equal(['today', 'thisMonth']);
      } finally {
        clock.restore();
      }
    });

    it('should return correct array if yesterday was last week and last month', function () {
      const clock = sinon.useFakeTimers(new Date('2017-05-01T00:00:00.00Z'));

      const result = periodMoverModule._getPeriodsToMoveToday();

      try {
        expect(result).to.be.deep.equal(['today', 'thisWeek', 'thisMonth']);
      } finally {
        clock.restore();
      }
    });
  });

  describe('_isNewWeek function', function () {
    it('should return true if yesterday was lastWeek', function () {
      const clock = sinon.useFakeTimers(new Date('2017-09-18T00:00:00.00Z'));

      const result = periodMoverModule._isNewWeek();

      try {
        expect(result).to.be.true;
      } finally {
        clock.restore();
      }
    });

    it('should return false if yesterday was thisWeek', function () {
      const clock = sinon.useFakeTimers(new Date('2017-09-23T00:00:00.00Z'));

      const result = periodMoverModule._isNewWeek();

      try {
        expect(result).to.be.false;
      } finally {
        clock.restore();
      }
    });
  });

  describe('_isNewMonth function', function () {
    it('should return true if yesterday was lastMonth', function () {
      const clock = sinon.useFakeTimers(new Date('2017-09-01T00:00:00.00Z'));

      const result = periodMoverModule._isNewMonth();

      try {
        expect(result).to.be.true;
      } finally {
        clock.restore();
      }
    });

    it('should return false if yesterday was thisMonth', function () {
      const clock = sinon.useFakeTimers(new Date('2017-09-23T00:00:00.00Z'));

      const result = periodMoverModule._isNewMonth();

      try {
        expect(result).to.be.false;
      } finally {
        clock.restore();
      }
    });
  });

  describe('_moveProjects function', function () {
    beforeEach(function () {
      const project = {
        _id: '1',
        trackingInfo: {
          allUsers: {
            today: { tracked: 5 * oneHour, earned: 50 },
            yesterday: { tracked: 4 * oneHour, earned: 40 },
            thisWeek: { tracked: 20 * oneHour, earned: 100 },
            lastWeek: { tracked: 25 * oneHour, earned: 150 },
            thisMonth: { tracked: 150 * oneHour, earned: 400 },
            lastMonth: { tracked: 200 * oneHour, earned: 600 }
          },
          individual: [
            {
              userId: '2',
              today: { tracked: 8 * oneHour, earned: 95 },
              yesterday: { tracked: 4 * oneHour, earned: 50 },
              thisWeek: { tracked: 45 * oneHour, earned: 120 },
              lastWeek: { tracked: 34 * oneHour, earned: 80 },
              thisMonth: { tracked: 172 * oneHour, earned: 580 },
              lastMonth: { tracked: 185 * oneHour, earned: 615 }
            }
          ]
        }
      };
      Projects.insert(project);
    });

    it('should move today for allUsers', function () {
      const periods = ['today'];
      const { trackingInfo } = Projects.findOne();
      
      periodMoverModule._moveProjects(periods);
      const { trackingInfo:updatedInfo } = Projects.findOne();

      expect(updatedInfo.allUsers.yesterday).to.be.deep.equal(trackingInfo.allUsers.today);
    });

    it('should move thisWeek for allUsers', function () {
      const periods = ['thisWeek'];
      const { trackingInfo } = Projects.findOne();

      periodMoverModule._moveProjects(periods);
      const { trackingInfo:updatedInfo } = Projects.findOne();

      expect(updatedInfo.allUsers.lastWeek).to.be.deep.equal(trackingInfo.allUsers.thisWeek);
    });

    it('should move thisMonth for allUsers', function () {
      const periods = ['thisMonth'];
      const { trackingInfo } = Projects.findOne();

      periodMoverModule._moveProjects(periods);
      const { trackingInfo:updatedInfo } = Projects.findOne();

      expect(updatedInfo.allUsers.lastMonth).to.be.deep.equal(trackingInfo.allUsers.thisMonth);
    });

    it('should move today for individual tracks', function () {
      const periods = ['today'];
      const { trackingInfo } = Projects.findOne();

      periodMoverModule._moveProjects(periods);
      const { trackingInfo:updatedInfo } = Projects.findOne();

      expect(updatedInfo.individual[0].yesterday).to.be.deep.equal(trackingInfo.individual[0].today);
    });

    it('should move thisWeek for individual tracks', function () {
      const periods = ['thisWeek'];
      const { trackingInfo } = Projects.findOne();

      periodMoverModule._moveProjects(periods);
      const { trackingInfo:updatedInfo } = Projects.findOne();

      expect(updatedInfo.individual[0].lastWeek).to.be.deep.equal(trackingInfo.individual[0].thisWeek);
    });

    it('should move thisMonth for individual tracks', function () {
      const periods = ['thisMonth'];
      const { trackingInfo } = Projects.findOne();

      periodMoverModule._moveProjects(periods);
      const { trackingInfo:updatedInfo } = Projects.findOne();

      expect(updatedInfo.individual[0].lastMonth).to.be.deep.equal(trackingInfo.individual[0].thisMonth);
    });

    afterEach(function () {
      Projects.remove({});
    });
  });

  describe('_moveTasks function', function () {
    beforeEach(function () {
      const task = {
        _id: '1',
        trackingInfo: {
          allUsers: {
            today: { tracked: 12 * oneHour, earned: 60 },
            yesterday: { tracked: 0, earned: 0 },
            thisWeek: { tracked: 50 * oneHour, earned: 200 },
            lastWeek: { tracked: 20 * oneHour, earned: 80 },
            thisMonth: { tracked: 175 * oneHour, earned: 700 },
            lastMonth: { tracked: 140 * oneHour, earned: 520 }
          },
          individual: [
            {
              userId: '2',
              today: { tracked: 2 * oneHour, earned: 12 },
              yesterday: { tracked: 4 * oneHour, earned: 25 },
              thisWeek: { tracked: 55 * oneHour, earned: 140 },
              lastWeek: { tracked: 42 * oneHour, earned: 102 },
              thisMonth: { tracked: 167 * oneHour, earned: 642 },
              lastMonth: { tracked: 214 * oneHour, earned: 1208 }
            }
          ]
        }
      };
      Tasks.insert(task);
    });

    it('should move today for allUsers', function () {
      const periods = ['today'];
      const { trackingInfo } = Tasks.findOne();

      periodMoverModule._moveTasks(periods);
      const { trackingInfo:updatedInfo } = Tasks.findOne();

      expect(updatedInfo.allUsers.yesterday).to.be.deep.equal(trackingInfo.allUsers.today);
    });

    it('should move thisWeek for allUsers', function () {
      const periods = ['thisWeek'];
      const { trackingInfo } = Tasks.findOne();

      periodMoverModule._moveTasks(periods);
      const { trackingInfo:updatedInfo } = Tasks.findOne();

      expect(updatedInfo.allUsers.lastWeek).to.be.deep.equal(trackingInfo.allUsers.thisWeek);
    });

    it('should move thisMonth for allUsers', function () {
      const periods = ['thisMonth'];
      const { trackingInfo } = Tasks.findOne();

      periodMoverModule._moveTasks(periods);
      const { trackingInfo:updatedInfo } = Tasks.findOne();

      expect(updatedInfo.allUsers.lastMonth).to.be.deep.equal(trackingInfo.allUsers.thisMonth);
    });

    it('should move today for individual tracks', function () {
      const periods = ['today'];
      const { trackingInfo } = Tasks.findOne();

      periodMoverModule._moveTasks(periods);
      const { trackingInfo:updatedInfo } = Tasks.findOne();

      expect(updatedInfo.individual[0].yesterday).to.be.deep.equal(trackingInfo.individual[0].today);
    });

    it('should move thisWeek for individual tracks', function () {
      const periods = ['thisWeek'];
      const { trackingInfo } = Tasks.findOne();

      periodMoverModule._moveTasks(periods);
      const { trackingInfo:updatedInfo } = Tasks.findOne();

      expect(updatedInfo.individual[0].lastWeek).to.be.deep.equal(trackingInfo.individual[0].thisWeek);
    });

    it('should move thisMonth for individual tracks', function () {
      const periods = ['thisMonth'];
      const { trackingInfo } = Tasks.findOne();

      periodMoverModule._moveTasks(periods);
      const { trackingInfo:updatedInfo } = Tasks.findOne();

      expect(updatedInfo.individual[0].lastMonth).to.be.deep.equal(trackingInfo.individual[0].thisMonth);
    });

    afterEach(function () {
      Tasks.remove({});
    });
  });

  /*describe('_getItemsToUpdate function', function () {
    const todayTrackedProject = {
      _id: '1',
      trackingInfo: {
        allUsers: {
          today: { tracked: 5 * oneHour }
        }
      }
    };
    const thisWeekTrackedProject = {
      _id: '2',
      trackingInfo: {
        allUsers: {
          thisWeek: { tracked: 30 * oneHour }
        }
      }
    };
    const thisMonthTrackedProject = {
      _id: '3',
      trackingInfo: {
        allUsers: {
          thisMonth: { tracked: 179 * oneHour }
        }
      }
    };

    it('should return items with today positive track', function () {
      Projects.insert(todayTrackedProject);
      const collection = Projects;
      const periodsToMove = [];

      const result = periodMoverModule._getItemsToUpdate(collection, periodsToMove);

      expect(result).to.be.an('array').that.has.lengthOf(1);
      expect(result[0]._id).to.be.equal(todayTrackedProject._id);
    });

    it('should return items with thisWeek positive track', function () {
      Projects.insert(thisWeekTrackedProject);
      const collection = Projects;
      const periodsToMove = ['thisWeek'];

      const result = periodMoverModule._getItemsToUpdate(collection, periodsToMove);

      expect(result).to.be.an('array').that.has.lengthOf(1);
      expect(result[0]._id).to.be.equal(thisWeekTrackedProject._id);
    });

    it('should return items with thisMonth positive track', function () {
      Projects.insert(thisMonthTrackedProject);
      const collection = Projects;
      const periodsToMove = ['thisMonth'];

      const result = periodMoverModule._getItemsToUpdate(collection, periodsToMove);

      expect(result).to.be.an('array').that.has.lengthOf(1);
      expect(result[0]._id).to.be.equal(thisMonthTrackedProject._id);
    });

    it('should return today and thisWeek positive tracks', function () {
      Projects.insert(todayTrackedProject);
      Projects.insert(thisWeekTrackedProject);
      const collection = Projects;
      const periodsToMove = ['thisWeek'];

      const result = periodMoverModule._getItemsToUpdate(collection, periodsToMove);

      expect(result).to.be.an('array').that.has.lengthOf(2);
      expect(result.find(item => item._id === todayTrackedProject._id)).to.not.be.undefined;
      expect(result.find(item => item._id === thisWeekTrackedProject._id)).to.not.be.undefined;
    });

    it('should return today and thisMonth positive tracks', function () {
      Projects.insert(todayTrackedProject);
      Projects.insert(thisMonthTrackedProject);
      const collection = Projects;
      const periodsToMove = ['thisMonth'];

      const result = periodMoverModule._getItemsToUpdate(collection, periodsToMove);

      expect(result).to.be.an('array').that.has.lengthOf(2);
      expect(result.find(item => item._id === todayTrackedProject._id)).to.not.be.undefined;
      expect(result.find(item => item._id === thisMonthTrackedProject._id)).to.not.be.undefined;
    });

    it('should return today, thisWeek and thisMonth positive tracks', function () {
      Projects.insert(todayTrackedProject);
      Projects.insert(thisWeekTrackedProject);
      Projects.insert(thisMonthTrackedProject);
      const collection = Projects;
      const periodsToMove = ['thisWeek', 'thisMonth'];

      const result = periodMoverModule._getItemsToUpdate(collection, periodsToMove);

      expect(result).to.be.a('array').that.has.lengthOf(3);
      expect(result.find(item => item._id === todayTrackedProject._id)).to.not.be.undefined;
      expect(result.find(item => item._id === thisWeekTrackedProject._id)).to.not.be.undefined;
      expect(result.find(item => item._id === thisMonthTrackedProject._id)).to.not.be.undefined;
    });

    afterEach(function () {
      Projects.remove({});
    });
  }); */

  describe('_moveAllUserTracks', function () {
    function getTrackingInfo() {
      return {
        allUsers: {
          today: { tracked: 5 * oneHour, earned: 40 },
          yesterday: { tracked: 6 * oneHour, earned: 34 },
          thisWeek: { tracked: 38 * oneHour, earned: 135 },
          lastWeek: { tracked: 34 * oneHour, earned: 102 },
          thisMonth: { tracked: 165 * oneHour, earned: 560 },
          lastMonth: { tracked: 158 * oneHour, earned: 540 }
        },
        individual: []
      };
    }
    it('should move today tracks', function () {
      const trackingInfo = getTrackingInfo();
      const periodsToMove = ['today'];

      const result = periodMoverModule._moveAllUserTracks(trackingInfo, periodsToMove);

      expect(result.allUsers.yesterday).to.be.deep.equal(trackingInfo.allUsers.today);
    });

    it('should move thisWeek tracks', function () {
      const trackingInfo = getTrackingInfo();
      const periodsToMove = ['thisWeek'];

      const result = periodMoverModule._moveAllUserTracks(trackingInfo, periodsToMove);

      expect(result.allUsers.lastWeek).to.be.deep.equal(trackingInfo.allUsers.thisWeek);
    });

    it('should move thisMonth tracks', function () {
      const trackingInfo = getTrackingInfo();
      const periodsToMove = ['thisMonth'];

      const result = periodMoverModule._moveAllUserTracks(trackingInfo, periodsToMove);

      expect(result.allUsers.lastMonth).to.be.deep.equal(trackingInfo.allUsers.thisMonth);
    });
  });

  describe('_moveIndividualTracks function', function () {
    function getTrackingInfo() {
      return {
        allUsers: {},
        individual: [
          {
            userId: '1',
            today: { tracked: 6 * oneHour, earned: 40 },
            yesterday: { tracked: 8 * oneHour, earned: 35 },
            thisWeek: { tracked: 58 * oneHour, earned: 160 },
            lastWeek: { tracked: 48 * oneHour, earned: 200 },
            thisMonth: { tracked: 180 * oneHour, earned: 1150 },
            lastMonth: { tracked: 173 * oneHour, earned: 875 }
          }
        ]
      }
    };
    it('should move today tracks', function () {
      const trackingInfo = getTrackingInfo();
      const periodsToMove = ['today'];

      const result = periodMoverModule._moveIndividualTracks(trackingInfo, periodsToMove);

      expect(result.individual[0].yesterday).to.be.deep.equal(trackingInfo.individual[0].today);
    });

    it('should move thisWeek tracks', function () {
      const trackingInfo = getTrackingInfo();
      const periodsToMove = ['thisWeek'];

      const result = periodMoverModule._moveIndividualTracks(trackingInfo, periodsToMove);

      expect(result.individual[0].lastWeek).to.be.deep.equal(trackingInfo.individual[0].thisWeek);
    });

    it('should move thisMonth tracks', function () {
      const trackingInfo = getTrackingInfo();
      const periodsToMove = ['thisMonth'];

      const result = periodMoverModule._moveIndividualTracks(trackingInfo, periodsToMove);

      expect(result.individual[0].lastMonth).to.be.deep.equal(trackingInfo.individual[0].thisMonth);
    });
  });

  afterEach(function () {
    StubCollections.restore();
  });
});
