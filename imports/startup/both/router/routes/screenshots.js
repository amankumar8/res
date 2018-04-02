Router.map(function () {
    this.route('screenshots', {
        path: '/screenshots/:screenshotsDate/:timeZone',
        layoutTemplate: 'mainLayout',
        action: function () {
            this.render('screenshotsMain');
        },
        data: function () {
            let projectIds = Router.current().params.query.project;
            return {
                pageTitle: 'Screenshots',
                dayToShowScreenshots: Router.current().params.screenshotsDate,
                timeZone: Router.current().params.timeZone,
                projectIds: _.isArray(projectIds) ? projectIds : []

            }
        }
    });

});