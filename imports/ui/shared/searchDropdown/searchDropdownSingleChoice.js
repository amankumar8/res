import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { parseProperty } from './propertyParser.js';
import './searchDropdownSingleChoice.html'

Template.searchDropdownSingleChoice.onCreated(function () {
    this.currentFilter = new ReactiveVar('');
    this.autorun(() => {
      let data = Template.currentData();
      const subParams = data.subscription;
      this.subscribe(subParams.name, this.currentFilter.get(), subParams.limit,  subParams.addQuery, subParams.addOptions);
    });
});

Template.searchDropdownSingleChoice.onRendered(function () {
    this.autorun(() => {
      let newQuery = {};
      let addQuery = this.data.subscription.addQuery;
      if (this.data.subscription.name === 'companiesByNameRegExpAlternative'){
        let companiesCreatedByUser = Roles.getGroupsForUser(Meteor.userId(), 'company-owner');
        let companiesWhereUserIsAdmin = Roles.getGroupsForUser(Meteor.userId(), 'company-admin');

        let relatedCompaniesDirectly = _.union(companiesCreatedByUser, companiesWhereUserIsAdmin);

        newQuery._id = {$in: relatedCompaniesDirectly};
      }
      addQuery = _.extend(addQuery, newQuery);
      const items = this.data.collection.find(addQuery).fetch();
      const data = items.reduce((result, item) => {
        result[parseProperty(item, this.data.fieldAccessor)] = null;
        return result;
      }, {});
        Tracker.afterFlush(() => {
          this.$('input').autocomplete({
            data,
            limit: 5,
            onAutocomplete: (value) => {
              let query = {};
              query[this.data.queryFieldName] = value;
              const item = this.data.collection.findOne(query);
              this.data.setFunction(item);
            }
          });
        });
    });

    this.autorun(() => {
      let data = Template.currentData();
      let valueName = data.value;
      if(valueName && _.keys(valueName).length > 0){
        let fieldAccessor = data.fieldAccessor;
        const value = parseProperty(valueName, fieldAccessor);
        this.$('.search-input').val(value);
      }
    });
});

Template.searchDropdownSingleChoice.helpers({
    placeholder() {
        return Template.instance().data.placeholder || 'Enter search value';
    },
});

Template.searchDropdownSingleChoice.events({
    'keyup input': function (event, template) {
        template.currentFilter.set(event.target.value);
    },
    'click input': function (event, template) {
        event.preventDefault();
        event.stopPropagation();
    }
});
