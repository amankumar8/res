import './work-bar-chart.html';

import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
Template.workBarChart.onCreated(function () {
  this.calculateData = (dateRange, daysCount, range, barRange, userId) => {
    let day = moment(dateRange.date).startOf(range).toDate();
    let resultArray = [];
    for (let i = 0; i < daysCount; i++) {
      let timeEntries = TimeEntries.find({
        userId: userId,
        startDate: {
          $gte: day,
          $lte: moment(day).endOf(barRange).toDate()
        }
      }).fetch();
      let sumHours = 0;
      _.each(timeEntries, function (entry) {
        let diff = moment(entry.endDate).diff(entry.startDate);
        sumHours += diff;
      });
      if (sumHours > 0) {
        sumHours = sumHours / 1000 / 60 / 60;
      }
      resultArray.push(sumHours);
      day = moment(day).add(1, barRange).toDate();
    }

    return resultArray;
  };

  this.chartData = (tmpl) => {
    let dataRange = tmpl.data && tmpl.data.dateRange && tmpl.data.dateRange.get() || tmpl.data.get();
    let userId = tmpl.data && tmpl.data.userId && tmpl.data.userId.get() || Meteor.userId();
    let data = {
      datasets: [{
        label: 'Work Hours',
        fillColor: 'rgb(52,128,255)',
        strokeColor: 'rgb(52,128,255)',
        highlightFill: 'rgb(52,128,255)',
        highlightStroke: 'rgb(52,128,255)'
      }]
    };

    switch (dataRange.range) {
      case 'Weekly':
        data.labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        data.datasets[0].data = this.calculateData(dataRange, 7, 'isoweek', 'day', userId);
        break;
      case 'Monthly':
        let monthDay = moment(tmpl.data.dateRange.get().date).startOf('month');
        let daysCount = moment(tmpl.data.dateRange.get().date).endOf('month').date();
        data.labels = [];
        data.datasets[0].data = this.calculateData(dataRange, daysCount, 'month', 'day', userId);

        for (let i = 0; i < daysCount; i++) {
          let format = moment(monthDay).format('ddd Do');
          format = format.replace(' ', '\n');
          data.labels.push(format);
          monthDay.add(1, 'd');
        }
        break;
      case 'Quarterly':
        let quarterDay = moment(tmpl.data.dateRange.get().date).startOf('quarter');
        data.labels = [];
        data.datasets[0].data = this.calculateData(dataRange, 3, 'quarter', 'month', userId);
        let months = moment.months();
        for (let i = 0; i < 3; i++) {
          let monthNumber = moment(quarterDay).month();
          data.labels.push(months[monthNumber]);
          quarterDay.add(1, 'M')
        }
        break;
      case 'Yearly':
        data.labels = moment.months();
        data.datasets[0].data = this.calculateData(dataRange, 12, 'year', 'month', userId);
        break;
      default:
        console.error('unexpected view type : ', dataRange.range);

    }

    return data;
  };

  this.chartOptions = (dataArray) => {
    let maxHours = parseInt(_.max(dataArray)) + 1,
      step,
      spacing;

    if (maxHours < 10) {
      step = 0.5;
    }
    else if (maxHours < 25) {
      step = 1;
    }
    else if (maxHours < 100) {
      step = 5;

    }
    else if (maxHours < 200) {
      step = 200 / 10;
    }
    else {
      step = 25;
    }

    let chartSteps = parseInt(maxHours / step);
    if (dataArray.length <= 3) {
      spacing = 50;
    }
    else if (dataArray.length <= 12) {
      spacing = 20;
    }
    else {
      spacing = 5;
    }

    let options = {
      responsive: true,
      barValueSpacing: spacing,
      scaleOverride: true,
      scaleSteps: chartSteps,
      scaleStepWidth: step,
      tooltipTemplate: '<%if (label){%><%=label%>: <%}%><%= formatChartLabel(value) %>'
    };

    return options;
  };
});

Template.workBarChart.onRendered(function () {
  let chartEl = this.$('#workBarChart').get(0).getContext('2d');

  let initChart = () => {
    let data = this.chartData(this);
    let options = this.chartOptions(data.datasets[0].data);

    if (this.workBarChart) {
      this.workBarChart.destroy();
    }
    this.workBarChart = new Chart(chartEl).Bar(data, options);
  };
  this.updateChartInterval = setInterval(function () {
    initChart();
  }, 60 * 1000);

  setTimeout(function () {
    initChart();
  }, 100)
});

Template.workBarChart.onDestroyed(function () {
  clearInterval(this.updateChartInterval);
});