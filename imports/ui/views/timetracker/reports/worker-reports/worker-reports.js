import { VZ } from '/imports/startup/both/namespace';
import { Contracts } from '/imports/api/contracts/contracts';
import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import './worker-reports.html';

Template.workerTimeTrackerReports.onCreated(function () {
    let dateRangeObj = {
        date: moment().toDate(),
        range: 'Weekly'
    };
    this.dateRange = new ReactiveVar(dateRangeObj);
    this.entriesLimit = new ReactiveVar(10);
    this.messageFilter = new ReactiveVar('');
    this.userId = new ReactiveVar(null);
    this.magic = new ReactiveVar(false);

    this.autorun(() => {
        let dateRange = this.dateRange.get();
        let messageFilter = this.messageFilter.get();
        let userId = this.userId.get();
        let workTimeSub = this.subscribe('workerReports', dateRange, [userId], messageFilter);
        let contractsSub = this.subscribe('ownerContracts', false);
        if(workTimeSub.ready() && contractsSub.ready()){
            this.magic.set(true);
        }
    });
    this.timeSummary = () => {
        let rangeObj = this.dateRange.get();
        let userId = this.userId.get();

        let start = moment(rangeObj.date).startOf(VZ.dateRanges[rangeObj.range]).toDate();
        let end = moment(rangeObj.date).endOf(VZ.dateRanges[rangeObj.range]).toDate();

        let totalMiliSeconds = 0;
        userId = userId ? userId : null;
        TimeEntries.find({
            userId: userId,
            startDate: {
                $gte: start,
                $lte: end
            }
        }).forEach(function (entry) {
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

Template.workerTimeTrackerReports.onRendered(function () {
    this.autorun(() => {
        this.magic.get();
        let contracts = Contracts.find({employerId: Meteor.userId()}).fetch();
        let workerIds = _.map(contracts, function (contract) {
            return contract.workerId;
        });
        workerIds = _.uniq(workerIds);
        let users = Meteor.users.find({_id: {$in: workerIds}}).fetch();
        if(users.length > 0){
            setTimeout(function () {
                this.$('select').material_select();
            },300);
        }
    });
});

Template.workerTimeTrackerReports.onDestroyed(function () {
    clearInterval(this.updateTimerIntervalId);
});

Template.workerTimeTrackerReports.helpers({
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
      let tmpl = Template.instance();
        let userId = tmpl.userId.get();
        let limit = tmpl.entriesLimit.get();
        let dateRange = tmpl.dateRange.get();
        let start = moment(dateRange.date).startOf(VZ.dateRanges[dateRange.range]).toDate();
        let end = moment(dateRange.date).endOf(VZ.dateRanges[dateRange.range]).toDate();
        return TimeEntries.find({
            _done: true,
            _isActive: false,
            userId:userId,
            startDate: {
                $gte: start,
                $lte: end
            }
        },{limit: limit, sort:{startDate: -1}});
    },

    isShowMoreBtn() {
        return Template.instance().entriesLimit.get() <= TimeEntries.find().count() - 1;
    },
    contractedUsers() {
        let contracts = Contracts.find({employerId: Meteor.userId()}).fetch();
        let workerIds = _.map(contracts, function (contract) {
            return contract.workerId;
        });
        workerIds = _.uniq(workerIds);
        return Meteor.users.find({_id: {$in: workerIds}}).fetch();
    },
    userId() {
        return Template.instance().userId;
    }
});

Template.workerTimeTrackerReports.events({
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

    'click .project-filter': function (e, tmpl) {
        tmpl.isProjectFilterActive.set(true);
    },

    'click .tag-filter': function (e, tmpl) {
        tmpl.isTagFilterActive.set(true);
    },

    'input #messageFilter': function (e, tmpl) {
        let msg = $(e.currentTarget).val();
        tmpl.messageFilter.set(msg)
    },

    'click .show-more-entries-btn': function (e, tmpl) {
        tmpl.entriesLimit.set(tmpl.entriesLimit.get() + 10)
    },
    'change #users-select': function (event, tmpl) {
        event.preventDefault();
        let userId = tmpl.$('#users-select option:selected').val();
        tmpl.userId.set(userId);
    }
});
