import './time-tracker-reports.html';
import './my-reports/my-reports';
import './projects-doughnut-chart/projects-doughnut-chart';
import './users-doughnut-chart/users-doughnut-chart';
import './work-bar-chart/work-bar-chart';
import './worker-reports/worker-reports';

Template.timeTrackerReports.onCreated(function () {
});
Template.timeTrackerReports.onRendered(function () {
    this.$('ul.tabs').tabs();
});
Template.timeTrackerReports.onDestroyed(function () {
});

Template.timeTrackerReports.helpers({
    tab() {
      let user = Meteor.user();
      return user.profile && user.profile.selectedCompanyId ? 'workerTimeTrackerReports' : 'myTimeTrackerReports';
    }
});

Template.timeTrackerReports.events({
});