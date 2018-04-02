import {VZ} from '/imports/startup/both/namespace';
import {TimeEntries} from '/imports/api/timeEntries/timeEntries';
import {removeTimeEntry} from '/imports/api/timeEntries/methods';

import './project-time-entries.html';
import '../time-entry-time-edit/time-entry-time-edit';
import './time-entry/time-entry';

Template.prjectTimeEntries.onCreated(function () {
  this.listView = new ReactiveVar('day');
  this.entriesLimit = new ReactiveVar(10);
  this.filterString = new ReactiveVar('');

  this.autorun(() => {
    let data = Template.currentData();
    let projectId = data.project && data.project._id;
    let filterString = this.filterString.get();

    let query = {
      projectId: projectId
    };
    if (filterString.length > 0) {
      query.message = {$regex: filterString, $options: 'gi'};
    }
    let options = {
      limit: this.entriesLimit.get(),
      sort: {startDate: -1}
    };
    this.subscribe('projectTimeEntries', query, options);
  });
});

Template.prjectTimeEntries.onRendered(function () {
  let self = this;
  this.$('select').material_select();

  this.autorun(() => {
    let data = Template.currentData();
    let projectId = data.project && data.project._id;
    let limit = this.entriesLimit.get();
    let query = {_isActive: false, projectId: projectId, userId: Meteor.userId()};
    let filterString = this.filterString.get();
    if (filterString.length > 0) {
      query.message = {$regex: filterString, $options: 'gi'};
    }
    let timeEntries = TimeEntries.find(query, {
      sort: {startDate: -1},
      limit: limit
    }).fetch();
    if (timeEntries.length > 0) {
      setTimeout(function () {
        self.$('.collapsible').collapsible();
      }, 300);
    }
  });
});

Template.prjectTimeEntries.helpers({
  hasEntries() {
    let tmpl = Template.instance();
    let filterString = tmpl.filterString.get();
    let projectId = tmpl.data && tmpl.data.project && tmpl.data.project._id;
    let query = {_isActive: false, projectId: projectId, userId: Meteor.userId()};

    if (filterString.length > 0) {
      query.message = {$regex: filterString, $options: 'gi'};
    }

    return !!TimeEntries.findOne(query);
  },
  timeEntriesGroups() {
    let tmpl = Template.instance();
    let limit = tmpl.entriesLimit.get();
    let filterString = tmpl.filterString.get();
    let projectId = tmpl.data && tmpl.data.project && tmpl.data.project._id;
    let query = {_isActive: false, projectId: projectId, userId: Meteor.userId()};
    if (filterString.length > 0) {
      query.message = {$regex: filterString, $options: 'gi'};
    }
    let timeEntries = TimeEntries.find(query, {
      sort: {startDate: -1},
      limit: limit
    }).fetch();
    let listView = Template.instance().listView.get();
    let groupBy = '';
    if (listView == 'day') {
      groupBy = 'DD MMMM, YYYY';
    }
    else if (listView == 'week') {
      groupBy = 'MMMM, YYYY';
    }
    else if (listView == 'month') {
      groupBy = 'MMMM, YYYY';
    }
    else if (listView == 'year') {
      groupBy = 'YYYY';
    }
    let timeEntriesGroupsObj = _.groupBy(timeEntries, function (timeEntry) {
      return moment(timeEntry.startDate).format(groupBy);
    });
    let timeEntriesGroups = _.map(timeEntriesGroupsObj, function (value, key) {
      return {
        label: key, timeEntries: value
      }
    });

    if (listView == 'year') {
      timeEntriesGroups = timeEntriesGroups.reverse();
    }
    return timeEntriesGroups;
  },


  shouldShowLoadMoreButton() {
    let limit = Template.instance().entriesLimit.get();
    return limit <= Counts.get('user-time-entries');
  },
});

Template.prjectTimeEntries.events({
  'change #view-select': function (event, tmpl) {
    let view = tmpl.$(event.currentTarget).val();

    //Warning : Materialize BS, for some reason I get a second event setting, right after the first change.
    // the value obtained is null so we need to check if we actually have something.
    if (view) {
      tmpl.listView.set(view);
    }
  },
  'input #filter-tasks': function (event, tmpl) {
    event.preventDefault();
    let searchString = tmpl.$('#filter-tasks').val();
    tmpl.filterString.set(searchString);
  },
  'click #time-tracker-show-more': function (event, tmpl) {
    tmpl.entriesLimit.set(tmpl.entriesLimit.get() + 5);
  },
  'click #delete-time-entry': function (event, tmpl) {
    let timeEntryId = this._id;
    removeTimeEntry.call({timeEntryId}, function (error, result) {
      if (error) {
        VZ.notify(error.message);
      }
    });
  },
});

let removeTemplate = function (view) {
  setTimeout(function () {
    Blaze.remove(view);
  }, 500);
};