import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { GoogleMaps } from 'meteor/dburles:google-maps';
import { PlaceParser } from './PlaceParser.js';
import { waitForPlaceholder } from './utils.js';
import {VZ} from '/imports/startup/both/namespace';
import './googleSearchBox.html'

Template.googleSearchBox.onCreated(function () {
  this.isRendered = new ReactiveVar(false);
  this.isAddressFieldReady = new ReactiveVar(false);
});

Template.googleSearchBox.onRendered(function () {
  GoogleMaps.load({v: '3', key: Meteor.settings.public.MAPS_API_KEY, libraries: 'places', language: 'en', region: 'US'});
  this.isRendered.set(true);
});

Template.googleSearchBox.helpers({
  isAllowedAndPossibleToShowMap() {
    const template = Template.instance();
    const controller = template.data.controller;
    return template.data.isMapAllowed &&
           !!controller && !!controller._location&&
           !!controller._location.address &&
           !!controller._location.country;
  },
  isAddressNotReady() {
    return Template.instance().isAddressFieldReady.get() === false;
  },
  getAddress() {
    const controller = Template.instance().data.controller;
    return controller && controller._location.get().address;
  },
  mapOptions() {
    const controller = Template.instance().data.controller;
    return controller && controller._location;
  },
  searchboxInitialization() {
    const template = Template.instance();
    if (GoogleMaps.loaded() && template.isRendered.get() === true && template.data.controller) {
      const addressInput = template.find('#address');
      waitForPlaceholder(addressInput, template);
      const searchBox = new google.maps.places.SearchBox(addressInput);
      const shouldParseCity = template.data.shouldParseCity === true && 'shouldParseCity';
      const PlaceParserInstance = new PlaceParser(template, searchBox, shouldParseCity);
      searchBox.addListener('places_changed', function (event) {
        if(template.data.controller) {
          PlaceParserInstance.parse().then(location => template.data.controller._location = location)
              .catch(err => {
                VZ.notify(err);
                console.error(err);
              });
        }
      });
    }
  }
});
