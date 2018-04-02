import { Template } from 'meteor/templating';
import { socialIcons } from './utils/utils.js';
import './socialMediaView.html'

Template.socialMediaView.helpers({
  getSocialIcon() {
    return socialIcons[this.socialMediaName];
  }
});
