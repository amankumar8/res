import './users-doughnut-chart.html';

Template.usersDoughnutChart.onRendered(function () {
    let chartEl = this.$('#usersChart').get(0).getContext('2d');
    let data = [{
        value: 5.6,
        color: '#F7464A',
        highlight: '#FF5A5E',
        label: 'Yura Srohiy'
    }, {
        value: 6.5,
        color: '#46BFBD',
        highlight: '#5AD3D1',
        label: 'Ihor Barmak'
    }, {
        value: 7.3,
        color: '#FDB45C',
        highlight: '#FFC870',
        label: 'Bodya'
    }];

    let options = {
        responsive: true
    };
    new Chart(chartEl).Doughnut(data, options)
});