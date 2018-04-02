import {VZ} from '/imports/startup/both/namespace';
import {TimeEntries} from '/imports/api/timeEntries/timeEntries';
import './my-reports.html';

Template.myTimeTrackerReports.onCreated(function () {
  let dateRangeObj = {
    date: moment().toDate(),
    range: 'Weekly'
  };
  this.dateRange = new ReactiveVar(dateRangeObj);
  this.limit = new ReactiveVar(10);

  //----------- filter vars -----------------
  this.messageFilter = new ReactiveVar();

  this.autorun(() => {
    let dateRange = this.dateRange.get();
    let messageFilter = this.messageFilter.get();

    this.subscribe('myReports', dateRange, messageFilter);
  });

  this.timeSummary = () => {
    let rangeObj = this.dateRange.get();
    let start = moment(rangeObj.date).startOf(VZ.dateRanges[rangeObj.range]).toDate();
    let end = moment(rangeObj.date).endOf(VZ.dateRanges[rangeObj.range]).toDate();

    let totalMiliSeconds = 0;
    let timeEntries = TimeEntries.find({
      userId: Meteor.userId(),
      startDate: {
        $gte: start,
        $lte: end
      }
    },{sort: {startDate: -1}});
    timeEntries.forEach(function (entry) {
      totalMiliSeconds += moment(entry.endDate).diff(entry.startDate);
    });

    let hours = parseInt(moment.duration(totalMiliSeconds).asHours());
    hours = hours < 10 ? '0' + hours : hours;
    return hours + moment.utc(totalMiliSeconds).format(':mm:ss')
  };
  this.timeWorked = new ReactiveVar(this.timeSummary());
  this.updateTimerIntervalId = setInterval(() => {
    this.timeWorked.set(this.timeSummary());
  }, 1000);
});

Template.myTimeTrackerReports.onRendered(function () {
  VZ.UI.dropdown('.vz-dropdown');
  VZ.UI.select('.vz-select');
});

Template.myTimeTrackerReports.onDestroyed(function () {
  clearInterval(this.updateTimerIntervalId);
});

Template.myTimeTrackerReports.helpers({
  timeWorked() {
    return Template.instance().timeWorked.get();
  },

  dateRange() {
    return Template.instance().dateRange;
  },

  pickerRange() {
    let dateRange = Template.instance().dateRange.get();
    let start = moment(dateRange.date).startOf(VZ.dateRanges[dateRange.range]).format('Do MMM YYYY');
    let end = moment(dateRange.date).endOf(VZ.dateRanges[dateRange.range]).format('Do MMM YYYY');
    return start + ' - ' + end;
  },

  entries() {
    let limit = Template.instance().limit.get();
    let dateRange = Template.instance().dateRange.get();
    let start = moment(dateRange.date).startOf(VZ.dateRanges[dateRange.range]).toDate();
    let end = moment(dateRange.date).endOf(VZ.dateRanges[dateRange.range]).toDate();

    return TimeEntries.find({
      _done: true,
      _isActive: false,
      userId: Meteor.userId(),
      startDate: {
        $gte: start,
        $lte: end
      }

    }, {limit: limit, sort: {startDate: -1}});
  },

  isShowMoreBtn() {
    return Template.instance().limit.get() <= TimeEntries.find().count() - 1;
  }
});

Template.myTimeTrackerReports.events({
  'change .dateRange-select': function (event, tmpl) {
    let range = tmpl.$(event.currentTarget).val();
    if (range) {
      let dateRange = tmpl.dateRange.get();
      dateRange.range = range;
      tmpl.dateRange.set(dateRange);
    }
  },

  'click .pick-prev-range': function (event, tmpl) {
    let dateRange = tmpl.dateRange.get();
    let range = VZ.dateRanges[dateRange.range];
    if (range === 'isoweek') {
      range = 'week'
    }
    dateRange.date = moment(dateRange.date).subtract(1, range).toDate();
    tmpl.dateRange.set(dateRange);
  },

  'click .pick-next-range': function (event, tmpl) {
    let dateRange = tmpl.dateRange.get();
    let range = VZ.dateRanges[dateRange.range];
    if (range === 'isoweek') {
      range = 'week'
    }
    dateRange.date = moment(dateRange.date).add(1, range).toDate();
    tmpl.dateRange.set(dateRange);
  },

  'input #messageFilter': function (e, tmpl) {
    let msg = $(e.currentTarget).val();
    tmpl.messageFilter.set(msg)
  },

  'click .show-more-entries-btn': function (e, tmpl) {
    tmpl.limit.set(tmpl.limit.get() + 10)
  }
});
