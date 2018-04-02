import moment from 'moment';
import StubCollections from 'meteor/hwillson:stub-collections';
import { expect, sinon } from '../testSetup';
import { TimeEntries } from '../../../timeEntries/timeEntries.js';
import { Projects } from '../../../projects/projects.js';
import { Tasks } from '../../../tasks/tasks.js';
import { Contracts } from '../../../contracts/contracts.js';
import { oneHour } from '../../server/helpers/index';
import * as updateTrack from '../../server/updateTrack.js';

describe('updateTrack module', function() {
    beforeEach(function () {
        StubCollections.add([Projects, Tasks, Contracts, TimeEntries]);
        StubCollections.stub();
    });

    describe('isToday method', function () {
        it('should return true for today', function () {
            const today = moment();
            
            const result = updateTrack.isToday(today);

            expect(result).to.be.true;
        });

        it('should return false for yesterday', function () {
            const yesterday = moment().subtract(1, 'day');

            const result = updateTrack.isToday(yesterday);

            expect(result).to.be.false;
        });

        it('should return false for tomorrow', function () {
            const tomorrow = moment().add(1, 'day');
  
            const result = updateTrack.isToday(tomorrow);

            expect(result).to.be.false;
        });
    });

    describe('isYesterday method', function () {
        it('should return true for yesterday', function () {
            const yesterday = moment().subtract(1, 'day');

            const result = updateTrack.isYesterday(yesterday);

            expect(result).to.be.true;
        });

        it('should return false for today', function () {
            const today = moment();
 
            const result = updateTrack.isYesterday(today);

            expect(result).to.be.false;
        });

        it('should return false for tomorrow', function () {
            const tomorrow = moment().add(1, 'day');
            
            const result = updateTrack.isYesterday(tomorrow);

            expect(result).to.be.false;
        });
    });

    describe('isThisWeek method', function () {
        it('should return true for this week', function () {
            const thisWeek = moment();

            const result = updateTrack.isThisWeek(thisWeek);

            expect(result).to.be.true;
        });

        it('should return false for next week', function () {
            const nextWeek = moment().add(1, 'week');
            
            const result = updateTrack.isThisWeek(nextWeek);

            expect(result).to.be.false;
        });

        it('should return false for last week', function () {
            const lastWeek = moment().subtract(1, 'week');

            const result = updateTrack.isThisWeek(lastWeek);

            expect(result).to.be.false;
        });
    });

    describe('isLastWeek method', function () {
        it('should return true for last week', function () {
            const lastWeek = moment().subtract(1, 'week');
            
            const result = updateTrack.isLastWeek(lastWeek);

            expect(result).to.be.true;
        });

        it('should return false for this week', function () {
            const thisWeek = moment();

            const result = updateTrack.isLastWeek(thisWeek);

            expect(result).to.be.false;
        });

        it('should return false for next week', function () {
            const nextWeek = moment().add(1, 'week');

            const result = updateTrack.isLastWeek(nextWeek);

            expect(result).to.be.false;
        });
    });

    describe('isThisMonth method', function () {
        it('should return true for this month', function () {
            const thisMonth = moment();

            const result = updateTrack.isThisMonth(thisMonth);

            expect(result).to.be.true;
        });

        it('should return false for next month', function () {
            const nextMonth = moment().add(1, 'month');

            const result = updateTrack.isThisMonth(nextMonth);

            expect(result).to.be.false;
        });

        it('should return false for last month', function () {
            const lastMonth = moment().subtract(1, 'month');

            const result = updateTrack.isThisMonth(lastMonth);

            expect(result).to.be.false;
        });
    });

    describe('isLastMonth method', function () {
        it('should return true for last month', function () {
            const lastMonth = moment().subtract(1, 'month');

            const result = updateTrack.isLastMonth(lastMonth);
            
            expect(result).to.be.true;
        });

        it('should return false for thisMonth', function () {
            const thisMonth = moment();

            const result = updateTrack.isLastWeek(thisMonth);
            
            expect(result).to.be.equal(false);
        });

        it('should return false for nextMonth', function () {
            const nextMonth = moment().add(1, 'month');
            
            const result = updateTrack.isLastMonth(nextMonth);

            expect(result).to.be.false;
        });
    });

    describe('_getTimePeriod method', function () {
        it('should return [today, thisWeek, thisMonth] for today', function () {
            const today = moment();

            const result = updateTrack._getTimePeriod(today);

            expect(result).to.deep.equal(['today', 'thisWeek', 'thisMonth']);
        });

        it('should return correct array when yesterday was this week and this month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-09-22T00:00:00.00Z'));
            const yesterday = moment().subtract(1, 'day');

            const result = updateTrack._getTimePeriod(yesterday);
            
            try {
              expect(result).to.deep.equal(['yesterday', 'thisWeek', 'thisMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return correct array when yesterday was this week and last month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-09-01T00:00:00.00Z'));
            const yesterday = moment().subtract(1, 'day');

            const result = updateTrack._getTimePeriod(yesterday);

            try {
              expect(result).to.be.deep.equal(['yesterday', 'thisWeek', 'lastMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return correct array when yesterday was last week and this month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-09-18T00:00:00.00Z'));
            const yesterday = moment().subtract(1, 'day');

            const result = updateTrack._getTimePeriod(yesterday);
            
            try {
              expect(result).to.be.deep.equal(['yesterday', 'lastWeek', 'thisMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return correct array when yesterday was last week and last month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-05-01T00:00:00.00Z'));
            const yesterday = moment().subtract(1, 'day');

            const result = updateTrack._getTimePeriod(yesterday);
            
            try {
              expect(result).to.be.deep.equal(['yesterday', 'lastWeek', 'lastMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return correct array when this the day before yesterday was this week and this month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-09-22T00:00:00.00Z'));
            const dayBeforeYesterday = moment().subtract(2, 'day');

            const result = updateTrack._getTimePeriod(dayBeforeYesterday);
            
            try {
              expect(result).to.be.deep.equal(['thisWeek', 'thisMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return correct array when day before yesterday was this week and last month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-09-02T00:00:00.00Z'));
            const dayBeforeYesterday = moment().subtract(2, 'day');

            const result = updateTrack._getTimePeriod(dayBeforeYesterday);
            
            try {
              expect(result).to.be.deep.equal(['thisWeek', 'lastMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return correct array when day before yesterday was last week and this month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-09-19T00:00:00.00Z'));
            const dayBeforeYesterday = moment().subtract(2, 'day');
            
            const result = updateTrack._getTimePeriod(dayBeforeYesterday);
            
            try {
              expect(result).to.deep.equal(['lastWeek', 'thisMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return correct array when day before yesterday was last week and last month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-08-01T00:00:00.00Z'));
            const dayBeforeYesterday = moment().subtract(2, 'day');
            
            const result = updateTrack._getTimePeriod(dayBeforeYesterday);

            try {
              expect(result).to.be.deep.equal(['lastWeek', 'lastMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return correct array when 2 weeks ago was this month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-09-22T00:00:00.00Z'));
            const twoWeeksAgo = moment().subtract(2, 'week');
            
            const result = updateTrack._getTimePeriod(twoWeeksAgo);

            try {
              expect(result).to.be.deep.equal(['thisMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return correct array when two weeks ago was last month', function () {
            const clock = sinon.useFakeTimers(new Date('2017-09-06T00:00:00.00Z'));
            const twoWeeksAgo = moment().subtract(2, 'week');
            
            const result = updateTrack._getTimePeriod(twoWeeksAgo);

            try {
              expect(result).to.be.deep.equal(['lastMonth']);
            } finally {
              clock.restore();
            }
        });

        it('should return [allTime] for two month ago', function () {
            const twoMonthAgo = moment().subtract(2, 'month');

            const result = updateTrack._getTimePeriod(twoMonthAgo);
            
            expect(result).to.be.deep.equal(['allTime']);
        });
    });

    describe('_prepareData method', function () {
        let timeEntry = {
            _id: '16',
            contractId: '1',
            projectId: '6',
            taskId: '2',
            userId: '8',
            startDate: moment().startOf('day').toDate(),
            endDate: moment().startOf('day').add(6, 'hour').toDate(),
            paymentRate: 6,
            _isActive: false,
            _done: true
        };
      let tracked = timeEntry.endDate - timeEntry.startDate;
      let earned = (timeEntry.paymentRate / oneHour) * tracked;

        it('should return object with correct trackingData property', function () {
            const period = ['today', 'thisWeek', 'thisMonth'];

            const { trackingData } = updateTrack._prepareData(timeEntry, tracked, earned);

            expect(trackingData.tracked).to.be.equal(tracked);
            expect(trackingData.earned).to.be.equal(earned);
            expect(trackingData.period).to.be.deep.equal(period);
        });

        it('should return object with correct contractInfo property', function () {
            const { contractInfo } = updateTrack._prepareData(timeEntry, tracked, earned);

            expect(contractInfo).deep.equal({ _id: '1', projectId: '6' });
        });

        it('should return object with correct projectInfo property', function () {
            const { projectInfo } = updateTrack._prepareData(timeEntry, tracked, earned);

            expect(projectInfo).deep.equal({ _id: '6', userId: '8' });
        });

        it('should return object with correct taskInfo property', function () {
            const { taskInfo } = updateTrack._prepareData(timeEntry, tracked, earned);

            expect(taskInfo).deep.equal({ _id: '2', userId: '8' });
        });
    });

    describe('_updateContract method', function () {
        const firstTaskTodayTE = {
            _id: '9',
            taskId: '1',
            startDate: moment().startOf('day').toDate(),
            endDate: moment().startOf('day').add(5, 'hour').toDate(),
            paymentType: 'hourly',
            paymentRate: 3,
            contractId: '1',
            projectId: '1',
            _isActive: false,
            _done: true
        };
        const tracked = firstTaskTodayTE.endDate - firstTaskTodayTE.startDate;
        const earned = (firstTaskTodayTE.paymentRate / oneHour) * tracked;
        const period = ['today', 'thisWeek', 'thisMonth'];
        beforeEach(function () {
            Contracts.insert({ 
              _id: '1',
              paymentInfo: {
                type: 'hourly'
              },
              trackingInfo: { 
                allTime: [
                  { 
                    tracked: 0, 
                    earned: 0,
                    projectId: '6'
                  }
                ]
              } 
            });
        });

        it('should update contract.trackingInfo.allTime.tracked property', function () {
            updateTrack._updateContract({ _id: '1', projectId: '6' }, { tracked, earned, period });
            const { trackingInfo } = Contracts.findOne('1', { fields: { trackingInfo: 1 } });

            expect(trackingInfo.allTime[0].tracked).to.be.equal(tracked);
        });

        it('should update contract.trackingInfo.allTime.earned property', function () {
            updateTrack._updateContract({ _id: '1', projectId: '6' }, { tracked, earned, period });
            const { trackingInfo } = Contracts.findOne('1', { fields: { trackingInfo: 1 } });

            expect(trackingInfo.allTime[0].earned).to.be.equal(earned);
        });

        afterEach(function () {
            Contracts.remove({});
        });
    });

    describe('_updateTIAllUsers function', function () {
      function getTrackingInfo() {
         return {
           allUsers: {
             allTime: { tracked: 0, earned: 0 },
             lastMonth: { tracked: 0, earned: 0 },
             thisMonth: { tracked: 0, earned: 0 },
             lastWeek: { tracked: 0, earned: 0 },
             thisWeek: { tracked: 0, earned: 0 },
             yesterday: { tracked: 0, earned: 0 },
             today: { tracked: 0, earned: 0 }
           }
         };
      }
       it('should update today tracked value', function () {
            const tracked = oneHour;
            const earned = 0;
            const period = ['today'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.today.tracked).to.be.equal(tracked);
        });

        it('should update today earned value', function () {
            const tracked = 5 * oneHour;
            const earned = 25;
            const period = ['today'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.today.earned).to.be.equal(earned);
        });

        it('should update yesterday tracked value', function () {
            const tracked = 5 * oneHour;
            const earned = 0;
            const period = ['yesterday'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.yesterday.tracked).to.be.equal(tracked);
        });

        it('should update yesterday earned value', function () {
            const tracked = 3 * oneHour;
            const earned = 15;
            const period = ['yesterday'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.yesterday.earned).to.be.equal(earned);
        });

        it('should update thisWeek tracked value', function () {
            const tracked = 40 * oneHour;
            const earned = 0;
            const period = ['thisWeek'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.thisWeek.tracked).to.be.equal(tracked);
        });

        it('should update thisWeek earned value', function () {
            const tracked = 10 * oneHour;
            const earned = 100;
            const period = ['thisWeek'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.thisWeek.earned).to.be.equal(earned);
        });

        it('should update lastWeek tracked value', function () {
            const tracked = 60 * oneHour;
            const earned = 0;
            const period = ['lastWeek'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.lastWeek.tracked).to.be.equal(tracked);
        });

        it('should update lastWeek eaned value', function () {
            const tracked = 20 * oneHour;
            const earned = 180;
            const period = ['lastWeek'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.lastWeek.earned).to.be.equal(earned);
        });

        it('should update thisMonth tracked value', function () {
            const tracked = 180 * oneHour;
            const earned = 0;
            const period = ['thisMonth'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.thisMonth.tracked).to.be.equal(tracked);
        });

        it('should update thisMonth earned value', function () {
            const tracked = 160 * oneHour;
            const earned = 1000;
            const period = ['thisMonth'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.thisMonth.earned).to.be.equal(earned);
        });

        it('should update lastMonth tracked value', function () {
            const tracked = 172 * oneHour;
            const earned = 0;
            const period = ['lastMonth'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.lastMonth.tracked).to.be.equal(tracked);
        });

        it('should update lastMonth earned value', function () {
            const tracked = 188 * oneHour;
            const earned = 600;
            const period = ['lastMonth'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.lastMonth.earned).to.be.equal(earned);
        });

        it('should update allTime tracked value', function () {
            const tracked = 800 * oneHour;
            const earned = 0;
            const period = ['allTime'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.allTime.tracked).to.be.equal(tracked);
        });

        it('should update allTime earned value', function () {
            const tracked = 1200 * oneHour;
            const earned = 5000;
            const period = ['allTime'];

            const result = updateTrack._updateTIAllUsers(getTrackingInfo(), { tracked, earned, period });

            expect(result.allUsers.allTime.earned).to.be.equal(earned);
        });
    });


    describe('_updateTIIndividual function', function () {
        const userId = '1';
        function getTrackingInfo() {
          return {
            individual: [
              {
                userId,
                allTime: { tracked: 0, earned: 0 },
                lastMonth: { tracked: 0, earned: 0 },
                thisMonth: { tracked: 0, earned: 0 },
                lastWeek: { tracked: 0, earned: 0 },
                thisWeek: { tracked: 0, earned: 0 },
                yesterday: { tracked: 0, earned: 0 },
                today: { tracked: 0, earned: 0 }
              }
            ]
          };
        }
        it('should update today tracked value', function () {
            const tracked = 5 * oneHour;
            const earned = 0;
            const period = ['today'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].today.tracked).to.be.equal(tracked);
        });

        it('should update today earned value', function () {
            const tracked = 6 * oneHour;
            const earned = 15;
            const period = ['today'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].today.earned).to.be.equal(earned);
        });

        it('should update yesterday tracked value', function () {
            const tracked = 10 * oneHour;
            const earned = 0;
            const period = ['yesterday'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].yesterday.tracked).to.be.equal(tracked);
        });

        it('should update yesterday earned value', function () {
            const tracked = 12 * oneHour;
            const earned = 56;
            const period = ['yesterday'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].yesterday.earned).to.be.equal(earned);
        });

        it('should update thisWeek tracked value', function () {
            const tracked = 40 * oneHour;
            const earned = 0;
            const period = ['thisWeek'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].thisWeek.tracked).to.be.equal(tracked);
        });

        it('should update thisWeek earned value', function () {
            const tracked = 40 * oneHour;
            const earned = 15;
            const period = ['thisWeek'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].thisWeek.earned).to.be.equal(earned);
        });

        it('should update lastWeek tracked value', function () {
            const tracked = 52 * oneHour;
            const earned = 0;
            const period = ['lastWeek'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].lastWeek.tracked).to.be.equal(tracked);
        });

        it('should update lastWeek earned value', function () {
            const tracked = 48 * oneHour;
            const earned = 100;
            const period = ['lastWeek'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].lastWeek.earned).to.be.equal(earned);
        });

        it('should update thisMonth tracked value', function () {
            const tracked = 170 * oneHour;
            const earned = 0;
            const period = ['thisMonth'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].thisMonth.tracked).to.be.equal(tracked);
        });

        it('should update thisMonth earned value', function () {
            const tracked = 180 * oneHour;
            const earned = 750;
            const period = ['thisMonth'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].thisMonth.earned).to.be.equal(earned);
        });

        it('should update lastMonth tracked value', function () {
            const tracked = 205 * oneHour;
            const earned = 0;
            const period = ['lastMonth'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].lastMonth.tracked).to.be.equal(tracked);
        });

        it('should update lastMonth earned value', function () {
            const tracked = 194 * oneHour;
            const earned = 940;
            const period = ['lastMonth'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].lastMonth.earned).to.be.equal(earned);
        });

        it('should update allTime tracked value', function () {
            const tracked = 700 * oneHour;
            const earned = 0;
            const period = ['allTime'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].allTime.tracked).to.be.equal(tracked);
        });

        it('should update allTime tracked and earned', function () {
            const tracked = 800 * oneHour;
            const earned = 4500;
            const period = ['allTime'];

            const result = updateTrack._updateTIIndividual(getTrackingInfo(), { tracked, earned, period }, userId);
            const userIndex = result.individual.findIndex(track => track.userId === userId);

            expect(result.individual[userIndex].allTime.earned).to.be.equal(earned);
        });
    });

    afterEach(function () {
        StubCollections.restore();
    });
});

