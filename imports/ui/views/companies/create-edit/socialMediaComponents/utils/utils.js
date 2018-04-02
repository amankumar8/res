import {VZ} from '/imports/startup/both/namespace';

export const socialMediaList = [
  'Facebook',
  'Twitter',
  'Google+',
  'Pinterest',
  'LinkedIn',
  'Instagram',
  'Youtube',
  'VK',
  'Reddit',
  'Medium'
];

export const socialIcons = {
  Facebook: 'fa fa-facebook',
  Twitter: 'fa fa-twitter',
  'Google+': 'fa fa-google-plus',
  Pinterest: 'fa fa-pinterest',
  LinkedIn: 'fa fa-linkedin',
  Instagram: 'fa fa-instagram',
  Crunchbase: 'fa fa-link',
  Youtube: 'fa fa-youtube',
  VK: 'fa fa-vk',
  Reddit: 'fa fa-reddit',
  Medium: 'fa fa-medium'
};

export const checkSocialMedia = function (data) {
  if (!data.socialMediaName) {
    VZ.notify('choose social media type');
    throw 'choose social media type';
  } else if (!data.socialMediaLink) {
    VZ.notify('enter url');
    throw 'enter url';
  } else if (data.socialMediaLink && SimpleSchema.RegEx.Url.test(data.socialMediaLink) === false) {
    VZ.notify('enter valid url');
    throw 'enter valid url';
  }
};
