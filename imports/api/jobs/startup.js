import {Countries} from '/imports/api/countries/countries';
import {JobCategories} from '/imports/api/jobCategories/jobCategories';
import {JobPerks} from '/imports/api/jobPerks/jobPerks';
import {JobTypes} from '/imports/api/jobTypes/jobTypes';
import {Skills} from '/imports/api/skills/skills';

Meteor.startup(function () {
  fillCollectionsWithDefaultData();

});

function fillCollectionsWithDefaultData() {
  let countriesList = Assets.getText('countries-list.json');
  countriesList = JSON.parse(countriesList);
  if (Countries.find().count() <= 0) {
    countriesList.forEach((country) => {
      Countries.insert(country);
    });
  }
}