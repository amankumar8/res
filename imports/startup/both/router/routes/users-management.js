import { VZ } from '/imports/startup/both/namespace';

Router.map(function () {
  this.route('userRoles', {
    path: '/user-roles/:id',
    layoutTemplate: 'mainLayout',
    template: 'userRoles',
    data: function () {
      return {
        pageTitle: 'User roles'
      }
    }
  });
  this.route('users-management', {
    path: '/users-management',
    layoutTemplate: 'mainLayout',
    template: 'usersByCompanyList',
    waitOn: function () {
      return [
        this.subscribe('roles.usersList')
      ];
    },
    data: function () {
      return {
        pageTitle: 'Users management'
      }
    }
  });
});
