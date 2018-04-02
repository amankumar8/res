import { VZ } from '/imports/startup/both/namespace';
import { Projects } from '/imports/api/projects/projects';
import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import './projects-doughnut-chart.html';


Template.projectsDoughnutChart.onCreated(function () {
    this.chartData = new ReactiveArray([]);

    this.calculateProjectTime = function (projectId, dataRange, userId) {
      let range = VZ.dateRanges[dataRange.range],
        startDate = moment(dataRange.date).startOf(range).toDate(),
        endDate = moment(dataRange.date).endOf(range).toDate(),
        sum = 0,
        entries = TimeEntries.find({
          userId: userId,
          projectId: projectId,
          startDate: {
            $gte: startDate,
            $lte: endDate
          }
        }).fetch();

      _.each(entries, function (entry) {
        sum += moment(entry.endDate).diff(entry.startDate);
      });
      if (sum > 0) {
        sum = sum / 1000 / 60 / 60;
      }
      return sum;
    };

    this.defineProjects = function (dataRange, userId) {
      let projects = new Set(),
        range = VZ.dateRanges[dataRange.range],
        startDate = moment(dataRange.date).startOf(range).toDate(),
        endDate = moment(dataRange.date).endOf(range).toDate();

      let entries = TimeEntries.find({
        userId: userId,
        startDate: {
          $gte: startDate,
          $lte: endDate
        }
      }).fetch();

      _.each(entries, function (entry) {
        if (entry.projectId) {
          let project = Projects.findOne({_id: entry.projectId});
          if (project) {
            projects.add(entry.projectId)
          }
        } else {
          projects.add(undefined)
        }
      });
      return projects;
    };

  this.initChart = (projects, chartEl, options) => {
    this.chartData.clear();
    let dateRange = this.data && this.data.dateRange && this.data.dateRange.get() || this.data.get();
    let userId = this.data && this.data.userId && this.data.userId.get() || Meteor.userId();

    projects.forEach((project) => {
      let label = 'No Project';
      if (project) {
        label = Projects.findOne({_id: project}).name;
      }
      this.chartData.push({
        value: this.calculateProjectTime(project, dateRange, userId),
        color: VZ.getRandomColor(),
        label: label
      })
    });

    if (this.projectsChart) {
      this.projectsChart.destroy();
    }
    this.projectsChart = new Chart(chartEl).Doughnut(this.chartData.array(), options);
  };

});

Template.projectsDoughnutChart.onRendered(function () {
    setTimeout(() => {
        let dateRange = this.data && this.data.dateRange && this.data.dateRange.get() || this.data.get();
        let userId = this.data && this.data.userId && this.data.userId.get() || Meteor.userId();

        let projects = this.defineProjects(dateRange, userId);
        let chartEl = this.$('#projectsChart').get(0).getContext('2d');

        let options = {
            responsive: true,
            tooltipTemplate: '<%if (label){%><%=label%>: <%}%><%= formatChartLabel(value) %>'
        };

        this.initChart(projects, chartEl, options);
    }, 100);
});

Template.projectsDoughnutChart.helpers({
    projects: function () {
        return Template.instance().chartData.list();
    }
});