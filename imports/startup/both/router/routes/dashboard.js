Router.map(function () {
    this.route('dashboard', {
        path: '/dashboard',
        layoutTemplate: 'mainLayout',
        template: 'dashboard',
        data: function () {
            return {
                pageTitle: 'Dashboard'
            }
        }
    });
  this.route('dashboard-grid', {
    path: '/dashboard-grid',
    layoutTemplate: 'mainLayout',
    template: 'dashboardGrid',
    data: function () {
      return {
        pageTitle: 'Dashboard grid'
      }
    }
  });
});
