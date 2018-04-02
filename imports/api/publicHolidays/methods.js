import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { PublicHolidays } from './publicHolidays';

const Methods = {
  updateHolidays: new ValidatedMethod({
    name: 'publicHolidays.updateHolidays',
    validate: new SimpleSchema({ countryCodes: { type: [ String ] } }).validator(),
    run ({ countryCodes }) {
      countryCodes.forEach(countryCode => {
        const countryHolidays = PublicHolidays.findOne({ countryCode });
        if (!countryHolidays) {
          throw new Error(`holidays info for country ${countryCode} missing`);
        }
        if (Methods.areNoHolidays(countryHolidays.holidays) ||
          Methods.isLastYear(countryHolidays.currentYear)) {
          Methods.updateCountryHolidays(countryHolidays._id, countryHolidays.googleCalendarId);
        }
      });
    }
  }),
  updateCountryHolidays (documentId, calendarId) {
    const newHolidaysInfo = this.requestHolidays(calendarId);
    const processedHolidays = newHolidaysInfo.data.items.map(info => info.start.date);
    PublicHolidays.update({ _id: documentId }, { $set: { holidays: processedHolidays } });
  },
  requestHolidays (id) {
    if (Meteor.isTest) {
      return { data: { items: [ { start: { date: '2017-01-01' } } ] } };
    } else if (Meteor.isServer) {
      import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';
      const Google = new GoogleApi();
      return Google.requestHolidays(id);
    }
  },
  areNoHolidays: holidays => holidays.length === 0,
  isLastYear (holidaysCurrentYear) {
    const holidayYear = parseInt(holidaysCurrentYear);
    const thisYear = moment().year();
    return holidayYear === thisYear - 1;
  }
};

export default Methods;