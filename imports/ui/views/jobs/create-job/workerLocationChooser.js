import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import {Countries} from "../../../../api/countries/countries";

import './workerLocationChooser.html'

Template.workerLocationChooser.onCreated(function() {
  this.continentVar = new ReactiveVar('');
  this.initVar = new ReactiveVar(false);
  const areCountriesDisabled = this.data.workerLocation && !this.data.workerLocation.country;
  this.areCountriesDisabledVar = new ReactiveVar(areCountriesDisabled);
  this.autorun(() => {
    this.initVar.get();
    this.continentVar.get();
    this.subscribe('allCountries');
    this.areCountriesDisabledVar.get();
    Tracker.afterFlush(() => {
      $('#country').material_select();
    });
  });
});

Template.workerLocationChooser.onRendered(function() {
  $('select').material_select();
  if(this.data.workerLocation) {
    this.continentVar.set(this.data.workerLocation.continent);
  }
});

Template.workerLocationChooser.helpers({
  continents() {
    return [
      {code: 'AF', name: 'Africa'},
      {code: 'AN', name: 'Antarctica'},
      {code: 'AS', name: 'Asia'},
      {code: 'EU', name: 'Europe'},
      {code: 'NA', name: 'North America'},
      {code: 'OC', name: 'Oceania'},
      {code: 'SA', name: 'South America'}
    ];
  },
  isContinentSelected() {
    const template = Template.instance();
    if(template.data.workerLocation) {
      return this.code === template.data.workerLocation.continent;
    }
  },
  continentCountries() {
    return Countries.find({continentCode: Template.instance().continentVar.get()}).fetch();
  },
  isCountrySelected() {
    const template = Template.instance();
    if(template.data.workerLocation) {
      template.initVar.set(true);
      return this.label === template.data.workerLocation.country;
    }
  },
  shouldDisableCountrySelect() {
    return Template.instance().areCountriesDisabledVar.get();
  },
  isCountryNotRestricted() {
    const workerLocation = Template.instance().data.workerLocation;
    return workerLocation && !workerLocation.country;
  }
});

Template.workerLocationChooser.events({
  'change #continent': function(event, template) {
    template.continentVar.set(event.target.value);
  },
  'click #notRestrictCountries': function(event, template) {
    template.areCountriesDisabledVar.set(event.target.checked === true);
  }
});
