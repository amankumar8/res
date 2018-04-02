Router.map(function () {
    this.route('timeTrackerReports', {
        path: '/time-tracker/reports',
        layoutTemplate: 'mainLayout',
        template: 'timeTrackerReports',
        data: function () {
            return {
                pageTitle: 'Reports'
            }
        }
    });
});
