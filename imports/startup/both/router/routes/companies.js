import { Companies } from '/imports/api/companies/companies';
import { VZ } from '/imports/startup/both/namespace';
import { companyUserPositions } from '/imports/startup/both/user-positions/company';

Router.map(function () {
  this.route('companies', {
    path: '/companies',
    layoutTemplate: 'mainLayout',
    template: 'companiesList',
    waitOn: function () {
      return [
        this.subscribe('companiesList')
      ];
    },
    data: function () {
      return {
        pageTitle: 'Companies',
        companies: Companies.find({isArchived: false}),
        archivedCompanies: Companies.find({isArchived: true})
      }
    }
  });

  this.route('assignUsersToCompany', {
    path: '/company/assign-users/:id',
    layoutTemplate: 'mainLayout',
    template: 'assigningUsers',
    waitOn: function () {
      return this.subscribe('Companies', {_id: this.params.id});
    },
    onBeforeAction: function () {
      if (!VZ.canUser('assignUsersToCompany', Meteor.userId(), this.params.id)) {
        VZ.notify('You have not permissions to view this page!');
        Router.go('companies')
      }
      this.next();
    },
    data: function () {
      const companyId = this.params.id;
      return {
        params: {
          methodForAssignUsersToEntityName: 'companies.assignUsersToCompany',
          userPositions: companyUserPositions,

          backwardRoute: {
            route: 'companies',
            params: {
              id: companyId
            }
          }
        },
        targetEntity: Companies.findOne({_id: this.params.id})
      }
    }
  });

  this.route('companyDetail', {
    path: '/company/:id',
    layoutTemplate: 'mainLayout',
    template: 'companyDetail',
    waitOn: function () {
      return [
        this.subscribe('Companies', {_id: this.params.id})
      ];
    },
    onBeforeAction: function () {
      if (VZ.canUser('viewCompany', Meteor.userId(), this.params.id)) {
        this.next();
      } else {
        Router.go('companies');
        VZ.notify('You have not permissions to view this page!');
      }
    },
    data: function () {
      return {
        pageTitle: 'Company details',
        company: Companies.findOne(this.params.id)
      }
    }
  });

});
