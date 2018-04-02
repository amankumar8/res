import './found-entity/found-entity';
import './entity-search.html';

import {Companies} from '/imports/api/companies/companies';
import {Projects} from '/imports/api/projects/projects';

Template.entitySearchForm.onCreated(function () {
  this.searchString = new ReactiveVar('');
  this.isInputFocused = new ReactiveVar(false);
  // dynamic subscription on users
  // subscribe by typed search string
  this.autorun(() => {
    let searchString = this.searchString.get();
    switch (this.data.entityName) {
      case 'users':
        this.subscribe('usersByNameOrEmailRegExp', searchString);
        break;
      case 'Projects':
        this.subscribe('projectsByNameRegExp', searchString);
        break;
      case 'Companies':
        this.subscribe('companiesByNameRegExp', searchString, 10);
        break;
    }
  });
});

Template.entitySearchForm.helpers({
  foundEntities() {
    let tmpl = Template.instance();

    let searchParams = {};
    let excludedEntitesIds = tmpl.data.excludedEntitiesIds || [];
    searchParams._id = {$nin: excludedEntitesIds};

    let availableEntitiesIds = tmpl.data.availableEntitiesIds || [];
    if (availableEntitiesIds.length > 0) {
      searchParams._id.$in = availableEntitiesIds;
    }

    let searchString = tmpl.searchString.get();
    if (searchString && searchString.length > 0) {
      let searchStringRegExp = new RegExp(searchString, 'gi');

      if (this.entityName === 'users') {
        searchParams.$or = [
          {'profile.fullName': {$regex: searchStringRegExp}},
          {'emails.address': {$regex: searchStringRegExp}}
        ];
      } else {
        searchParams[this.displayedPropertyName] = {$regex: searchStringRegExp}
      }
    }

    if (this.entityName === 'users') {
      return Meteor.users.find(searchParams, {limit: 10});
    }
    else if (this.entityName === 'Companies') {
      return Companies.find(searchParams, {limit: 10});
    }
    else if (this.entityName === 'Projects') {
      return Projects.find(searchParams, {limit: 10});
    }


  },
  onSelectEntity() {
    return Template.instance().data.onSelectEntity;
  },
  isInputFocused() {
    let tmpl = Template.instance();
    return tmpl.isInputFocused.get();
  }
});

Template.entitySearchForm.events({
  'input #searchString': _.throttle(function (event, tmpl) {
    event.preventDefault();
    let $input = tmpl.$('#searchString');
    let value = $input.val();
    value = value.replace(/[/\\$%^:]/g, '');
    $input.val(value);

    tmpl.searchString.set(value);
  }, 100),

  'focus #searchString': function (event, tmpl) {
    tmpl.isInputFocused.set(true);
  },
  'blur #searchString': function (event, tmpl) {
    tmpl.isInputFocused.set(false);
  },

  'click .cancel-add-assignedUser-icon': function (event, tmpl) {
    tmpl.isInputFocused.set(false);
    tmpl.searchString.set('');
    tmpl.$('#searchString').val('');

  }
});
