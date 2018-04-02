import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const publicHolidaysSchema = new SimpleSchema({
  _id: {
    type: String,
    optional: true
  },
  countryCode: {
    type: String
  },
  googleCalendarId: {
    type: String
  },
  weekends: {
    type: [Number]
  },
  holidays: {
    type: [Date]
  },
  currentYear: {
    type: String
  }
});

export const PublicHolidays = new Mongo.Collection('vz-public-holidays');
PublicHolidays.attachSchema(publicHolidaysSchema);

