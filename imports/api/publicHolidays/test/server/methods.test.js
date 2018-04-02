import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import StubCollections from 'meteor/hwillson:stub-collections';
import { expect, sinon } from '../testSetup.js';
import { PublicHolidays } from '../../publicHolidays';
import publicHolidaysMethods from '../../methods';

describe('publicHolidays methods', function () {
  beforeEach(function () {
    StubCollections.add([ Meteor.users, PublicHolidays ]);
    StubCollections.stub();
  });

  describe('updateHolidays method', function () {
    beforeEach(function () {
      const japaneseHoliday = {
        _id: '1',
        countryCode: 'JP',
        googleCalendarId: 'en.japanese#holiday@group.v.calendar.google.com',
        weekends: [ 6, 7 ],
        holidays: [],
        currentYear: '2017'
      };
      PublicHolidays.insert(japaneseHoliday);
    });

    it('should throw if there no country info in db', function () {
      const data = { countryCodes: [ 'UA' ] };
      const callUpdateHolidays = () => publicHolidaysMethods.updateHolidays.call(data);

      expect(callUpdateHolidays).to.throw(Error);
    });

    it('should call updateCountryHolidays if there no holidays', function () {
      const data = { countryCodes: [ 'JP' ] };
      const spyUpdateCountry = sinon.spy(publicHolidaysMethods, 'updateCountryHolidays');

      try {
        publicHolidaysMethods.updateHolidays.call(data);

        expect(spyUpdateCountry.called).to.be.true;
      } catch (err) {
        throw err;
      } finally {
        spyUpdateCountry.restore();
      }
    });

    it('should call updateCountryHolidays if next year take place', function () {
      const clock = sinon.useFakeTimers(new Date('2018-01-01T00:00:00.00Z'));
      PublicHolidays.update({ _id: '1' }, { $set: { holidays: [ '2017-01-01' ] } });
      const japaneseHolidays = PublicHolidays.findOne();
      const data = { countryCodes: [ 'JP' ] };
      const spyUpdateCountry = sinon.spy(publicHolidaysMethods, 'updateCountryHolidays');

      try {
        publicHolidaysMethods.updateHolidays.call(data);

        expect(publicHolidaysMethods.areNoHolidays(japaneseHolidays)).to.be.false;
        expect(spyUpdateCountry.called).to.be.true;
      } catch (err) {
        throw err;
      } finally {
        clock.restore();
        spyUpdateCountry.restore();
      }
    });

    it('should not call updateCountryHolidays if holidays present and still 2017 year', function () {
      const clock = sinon.useFakeTimers(new Date('2017-01-01T00:00:00.00Z'));
      PublicHolidays.update({ _id: '1' }, { $set: { holidays: [ '2017-01-01' ] } });
      const data = { countryCodes: [ 'JP' ] };
      const spyUpdateCountry = sinon.spy(publicHolidaysMethods, 'updateCountryHolidays');

      try {
        publicHolidaysMethods.updateHolidays.call(data);

        expect(spyUpdateCountry.called).to.be.false;
      } catch (err) {
        throw err;
      } finally {
        clock.restore();
        spyUpdateCountry.restore();
      }
    });

    afterEach(function () {
      PublicHolidays.remove({});
    });
  });

  describe('updateCountryHolidays function', function () {
    beforeEach(function () {
      const japaneseHoliday = {
        _id: '1',
        countryCode: 'JP',
        googleCalendarId: 'en.japanese#holiday@group.v.calendar.google.com',
        weekends: [ 6, 7 ],
        holidays: [],
        currentYear: '2017'
      };
      PublicHolidays.insert(japaneseHoliday);
    });

    it('should call requestHolidays', function () {
      const spyRequest = sinon.spy(publicHolidaysMethods, 'requestHolidays');
      const documentId = '1';
      const calendarId = PublicHolidays.findOne().googleCalendarId;

      publicHolidaysMethods.updateCountryHolidays(documentId, calendarId);

      expect(spyRequest.called).to.be.true;

      spyRequest.restore();
    });

    it('should update holidays', function () {
      const documentId = '1';
      const calendarId = PublicHolidays.findOne().googleCalendarId;
      const expectedData = [ publicHolidaysMethods.requestHolidays(calendarId).data.items[ 0 ].start.date ];

      publicHolidaysMethods.updateCountryHolidays(documentId, calendarId);
      const updatedHolidays = PublicHolidays.findOne();

      expect(updatedHolidays.holidays).to.be.deep.equal(expectedData);
    });

    afterEach(function () {
      PublicHolidays.remove({});
    });
  });

  describe('areNoHolidays function', function () {
    it('should return true of holidays array is empty', function () {
      const holidays = [];

      const result = publicHolidaysMethods.areNoHolidays(holidays);

      expect(result).to.be.true;
    });

    it('should return false if holidays arrays is not empty', function () {
      const holidays = [ '2017-10-31' ];

      const result = publicHolidaysMethods.areNoHolidays(holidays);

      expect(result).to.be.false;
    });
  });

  describe('isLastYear function', function () {
    it('should return false if current year same with argument', function () {
      const holidaysCurrentYear = moment().year();

      const result = publicHolidaysMethods.isLastYear(holidaysCurrentYear);

      expect(result).to.be.false;
    });

    it('should return false if current year is one year before argument', function () {
      const holidaysCurrentYear = moment().add(1, 'year').year();

      const result = publicHolidaysMethods.isLastYear(holidaysCurrentYear);

      expect(result).to.be.false;
    });

    it('should return true if current year is one year later than argument', function () {
      const holidaysCurrentYear = moment().subtract(1, 'year').year();

      const result = publicHolidaysMethods.isLastYear(holidaysCurrentYear);

      expect(result).to.be.true;
    });
  });

  afterEach(function () {
    StubCollections.restore();
  });
});