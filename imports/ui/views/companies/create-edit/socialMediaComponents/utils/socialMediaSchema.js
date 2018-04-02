import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const socialMediaSchema = new SimpleSchema({
  _id: {
    type: String,
    optional: true
  },
  socialMediaName: {
    type: String
  },
  socialMediaLink: {
    type: String
  }
});