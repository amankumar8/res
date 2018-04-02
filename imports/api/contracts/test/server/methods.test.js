import { expect, sinon } from '../testSetup.js';
import { updateUserCountryHolidays, countDaysLeftThisMonth} from "../../methods";
import moment from 'moment';
import { Contracts } from "../../contracts";
import { PublicHolidays } from "/imports/api/publicHolidays/publicHolidays";
import { TimeEntries } from "/imports/api/timeEntries/timeEntries";
import StubCollections from 'meteor/hwillson:stub-collections';

const oneHour = 1000 * 60 * 60;

describe('contract methods', function () {
  beforeEach(function () {
    StubCollections.add([Meteor.users, Contracts, PublicHolidays]);
    StubCollections.stub();
  });

  describe('updateUserCountryHolidays function', function () {
    beforeEach(function () {
      const user1 = {
        _id: '1',
        profile: {
          location: {
            country: 'Ukraine'
          }
        }
      };
      const user2 = {
        _id: '2',
        profile: {}
      };
      const contract = {
        _id: '3',
      };
      const japaneseHolidays = {
        _id: '4',
        countryCode: 'JP',
        googleCalendarId: 'en.japanese#holiday@group.v.calendar.google.com',
        weekends: [ 6, 7 ],
        holidays: [],
        currentYear: '2017'
      };
      const ukrainianHolidays = {
        _id: '5',
        countryCode: 'UA',
        googleCalendarId: 'en.ukrainian#holiday@group.v.calendar.google.com',
        weekends: [ 6, 7 ],
        holidays: [],
        currentYear: '2017'
      };
      Meteor.users.insert(user1);
      Meteor.users.insert(user2);
      Contracts.insert(contract);
      PublicHolidays.insert(japaneseHolidays);
      PublicHolidays.insert(ukrainianHolidays);
    });

    it('should throw error if userId not supplied', function () {
      const userId = undefined;
      const contractId = '3';
      const runFunc = () => updateUserCountryHolidays(userId, contractId);

      expect(runFunc).throw(Error);
    });

    it('should update contract with JP country code if user not has location', function () {
      const userId = '2';
      const contractId = '3';
      const defaultCountryCode = 'JP';

      updateUserCountryHolidays(userId, contractId);
      const contract = Contracts.findOne();

      expect(contract.countryCode).to.be.equal(defaultCountryCode);
    });

    it('should update contract with user location country code', function () {
      const userId = '1';
      const contractId = '3';
      const userCode = 'UA';

      updateUserCountryHolidays(userId, contractId);
      const contract = Contracts.findOne();

      expect(contract.countryCode).to.be.equal(userCode);
    });

    it('should update publicHolidays', function () {
      const userId = '2';
      const contractId = '3';

      updateUserCountryHolidays(userId, contractId);
      const jpHolidays = PublicHolidays.findOne({_id: '4'});

      expect(jpHolidays.holidays).to.be.an('array').that.has.lengthOf(1);
    });

    afterEach(function () {
      Meteor.users.remove({});
      Contracts.remove({});
      PublicHolidays.remove({});
    });
  });

  describe('countDaysLeftThisMonth method', function () {
    beforeEach(function () {
      const contract = {
        _id: '2'
      };
      const russianHolidays = {
        _id: '3',
        countryCode: 'RU',
        googleCalendarId: 'en.russian#holiday@group.v.calendar.google.com',
        weekends: [ 6, 7 ],
        holidays: ['2017-01-01', '2017-01-06'],
        currentYear: '2017'
      };
      const todayTE1 = {
        _id: '4',
        startDate: moment('2017-01-14').startOf('day').toDate(),
        endDate: moment('2017-01-14').startOf('day').add(1, 'hour').toDate(),
        _isActive: false
      };
      const todayTE2 = {
        _id: '5',
        startDate: moment('2017-01-14').startOf('day').add(5, 'hour').toDate(),
        endDate: moment('2017-01-14').startOf('day').add(15, 'hour').toDate(),
        _isActive: false
      };
      Contracts.insert(contract);
      PublicHolidays.insert(russianHolidays);
      TimeEntries.insert(todayTE1);
      TimeEntries.insert(todayTE2);
    });

    it('should throw if there no holiday in db for given country code', function () {
      const data = {
        _id: '2',
        countryCode: 'AF',
        workingDaysThisMonth: 0
      };
      const runFunc = () => countDaysLeftThisMonth.call(data);

      expect(runFunc).throw(Error);
    });

    it('should update in contract workingTimeLeft without te', function () {
      const clock = sinon.useFakeTimers(new Date('2017-01-14'));
      TimeEntries.remove({});
      const data = {
        _id: '2',
        countryCode: 'RU',
        workingDaysThisMonth: 0
      };
      const expectedResult = 12 * 8 * oneHour;

      try {
        countDaysLeftThisMonth.call(data);
        const contract = Contracts.findOne();

        expect(contract.workingTimeLeft).to.be.a('number').that.is.equal(expectedResult);
      } catch (err) {
        throw err;
      } finally {
        clock.restore();
      }
    });

    it('should update in contract workingTimeLeft with te', function () {
      const clock = sinon.useFakeTimers(new Date('2017-01-14'));
      const data = {
        _id: '2',
        countryCode: 'RU',
        workingDaysThisMonth: 0
      };
      const timeEntries = TimeEntries.find({}).fetch();
      const workedToday = timeEntries.reduce((sum, timeEntry) => {
        sum += timeEntry.endDate - timeEntry.startDate;
        return sum;
      }, 0);
      const expectedResult = 12 * 8 * oneHour - workedToday;

      try {
        countDaysLeftThisMonth.call(data);
        const contract = Contracts.findOne();

        expect(contract.workingTimeLeft).to.be.a('number').that.is.equal(expectedResult);
      } catch (err) {
        throw err;
      } finally {
        clock.restore();
      }
    });

    it('should update in contract workingDaysThisMonth', function () {
      const clock = sinon.useFakeTimers(new Date('2017-01-14'));
      const data = {
        _id: '2',
        countryCode: 'RU',
        workingDaysThisMonth: 0
      };
      const expectedResult = 21;

      try {
        countDaysLeftThisMonth.call(data);
        const contract = Contracts.findOne();

        expect(contract.workingDaysThisMonth).to.be.a('number').that.is.equal(expectedResult);
      } catch (err) {
        throw err;
      } finally {
        clock.restore();
      }
    });

    it('should set workingDaysLastMonth on 1st day of month', function () {
      const clock = sinon.useFakeTimers(new Date('2017-01-01'));
      const data = {
        _id: '2',
        countryCode: 'RU',
        workingDaysThisMonth: 20
      };

      try {
        countDaysLeftThisMonth.call(data);
        const contract = Contracts.findOne();

        expect(contract.workingDaysLastMonth).to.be.a('number').that.is.equal(data.workingDaysThisMonth);
      } catch (err) {
        throw err;
      } finally {
        clock.restore();
      }
    });

    afterEach(function () {
      PublicHolidays.remove({});
      Contracts.remove({});
      TimeEntries.remove({});
    });
  });

  afterEach(function () {
    StubCollections.restore();
  });
});