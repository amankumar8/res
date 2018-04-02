import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { socialMediaSchema } from './utils/socialMediaSchema.js';
import { socialIcons, checkSocialMedia } from './utils/utils.js';
import './socialMediaInput.html'

Template.socialMediaInput.onCreated(function() {
  this.lastId = this.data.tempData;
  this.addedSocialMediaCollection = new Mongo.Collection(null);
  this.addedSocialMediaCollection.attachSchema(socialMediaSchema);
  this.itemId = this.data.tempData;
});

Template.socialMediaInput.onRendered(function () {
  this.autorun(() => {
    if(this.data.tempData !== this.lastId) {
      this.lastId = this.data.tempData;
      this.data.controller && this.data.controller.reset();
    }
    Template.currentData();
    initialize.call(this);
    this.data.controller && this.data.controller.currentlyAllowedTypes;
    Tracker.afterFlush(() => {
      $('select').material_select();
    });
  });

});

Template.socialMediaInput.helpers({
  socialMedia() {
    const controller = Template.instance().data.controller;
    return controller && controller.currentlyAllowedTypes;
  },
  addedSocialMedia() {
    return Template.instance().addedSocialMediaCollection.find().fetch();
  },
  socialIcon() {
    return socialIcons[this.socialMediaName];
  }
});

Template.socialMediaInput.events({
  'click .add-social-media': function(event, template) {
    const socialMediaName = template.find('#social-media').value;
    const socialMediaLink = template.find('#social-media-url').value.trim();
    const data = {
      socialMediaName,
      socialMediaLink
    };
    checkSocialMedia(data);
    template.addedSocialMediaCollection.insert(data);
    template.find('#social-media-url').value = "";
    template.data.controller.removeFromAllowedTypes(socialMediaName);
  },
  'click .remove-social-media': function(event, template) {
    template.addedSocialMediaCollection.remove(this._id);
    template.data.controller.addToAllowedTypes(this.socialMediaName);
  }
});

function initialize() {
  if( Template.currentData().socialMedia &&
      Template.currentData().socialMedia.length > this.addedSocialMediaCollection.find().count() &&
      this.data.controller.working === false) {
    this.data.controller.initialized = false;
  }
  if( !!this.data.controller &&
      Template.currentData().socialMedia &&
      this.data.controller.initialized === false) {
    this.data.controller.collection = this.addedSocialMediaCollection;
    const socialMedia = Template.currentData().socialMedia;
    if(socialMedia) {
      this.addedSocialMediaCollection.remove({});
      for(let x = 0, count = socialMedia.length; x < count; x++) {
        this.addedSocialMediaCollection.insert(socialMedia[x]);
        this.data.controller.removeFromAllowedTypes(socialMedia[x].socialMediaName);
      }
    }
    this.data.controller.initialized = true;
  }
}
