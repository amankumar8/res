import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { parseProperty } from './propertyParser.js';
import './searchDropdownMultiChoice.html'

Template.searchDropdownMultiChoice.onCreated(function () {
    this.currentFilter = new ReactiveVar('');
    this.currentSelected = new ReactiveVar(this.data.value || []);
    this.autorun(() => {
      this.currentSelected.set(Template.currentData().value);
      const subParams = this.data.subscription;
      this.subscribe(subParams.name, this.currentFilter.get(), subParams.limit, 
        subParams.addQuery, subParams.addOptions);
      const subValueParams = this.data.subscriptionValue;  
      this.subscribe(subValueParams.name, subValueParams.query, subValueParams.options);
    });
});

Template.searchDropdownMultiChoice.onRendered(function () {
  this.autorun(() => {
    let items = this.data.collection.find(this.data.subscription.addQuery).fetch();
    items = items.sort((a, b) => parseProperty(a, this.data.fieldAccessor).length - parseProperty(b, this.data.fieldAccessor).length);
    const data = items.reduce((result, item) => {
      result[parseProperty(item, this.data.fieldAccessor)] = null;
      return result;
    }, {});
    Tracker.afterFlush(() => {
      this.$('input').autocomplete({
        data,
        limit: 5,
        onAutocomplete: (value) => {
          let selected = this.currentSelected.get();
          const selectedItem = selected.find(item => parseProperty(item, this.data.fieldAccessor) === value);
          if (selectedItem) {
            // selected = selected.filter(item => item._id !== selectedItem._id);
          } else {
            const query = {};
            query[this.data.queryFieldName] = value;
            const realItem = this.data.collection.findOne(query);
            selected.push(realItem);
          }
          this.currentSelected.set(selected);
          this.data.setFunction(selected);
        }
      });
    });
  });
});

Template.searchDropdownMultiChoice.helpers({
    filteredResults() {
        const data = Template.instance().data;
        return data.collection.find(data.subscription.addQuery).fetch();
    },
    placeholder() {
        return Template.instance().data.placeholder || 'Enter search value';
    },
    getField() {
        return parseProperty(this, Template.instance().data.fieldAccessor);
    },
    getValue() {
        const template = Template.instance();
        if (template.data.value) {
            const value = parseProperty(template.data.value, template.data.fieldAccessor);
            template.currentFilter.set(value);
            // template.currentValue.set(template.data.value._id);
            return value;
        }
    },
    getItemName() {
      const id = this._id;
      const template = Template.instance();
      const item = template.data.collection.findOne({ _id: id });
      return parseProperty(item, template.data.fieldAccessor);
    },
    isChecked() {
      const value = Template.instance().data.value;
      return value && !!(value.find(project => this._id === project._id));
    },
    defaultButtonName() {
      return Template.instance().data.buttonName;
    },
    getItemsSelected () {
      return Template.instance().currentSelected.get();
    }
});

Template.searchDropdownMultiChoice.events({
    'keyup input': function (event, template) {
      template.currentFilter.set(event.target.value);
    },
    'click input': function (event, template) {
      event.preventDefault();
      event.stopPropagation();
    },
    'click .result-item': function (event, template) {
      let selected = template.currentSelected.get();
      const selectedItem = selected.find(item => item._id === this._id);
      if(selectedItem) {
        selected = selected.filter(item => item._id !== selectedItem._id);
      }
      template.currentSelected.set(selected);
      template.data.setFunction(selected);
    }
});
