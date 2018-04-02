import {Projects} from '/imports/api/projects/projects';
import {Notifications} from '/imports/api/notifications/notifications';
import {Companies} from '/imports/api/companies/companies';
import {VZ} from '/imports/startup/both/namespace';
import './dropdown-container/dropdown-container';
import './search-bar/search-bar';
import './top-nav-bar.html';
import {unreadNotificationsCount, markNotifications, markAllNotifications} from '/imports/api/notifications/methods';
import {updateSelectedCompanyId, updateSelectedJobId} from '/imports/api/users/methods';

Template.topNavBar.onCreated(function () {
  this.unreadNotificationsCount = new ReactiveVar();
  this.notificationsChanged = new ReactiveVar(true);
  this.unreadedNotificationsIds = new ReactiveVar([]);
  this.inputFilter = new ReactiveVar('');
  this.selectedCompanyId = new ReactiveVar();

  this.autorun(() => {
    this.notificationsChanged.get();
    Notifications.find().count();
    unreadNotificationsCount.call({}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        VZ.notify(message);
      } else {
        this.unreadNotificationsCount.set(res);
      }
    });
  });
  this.autorun(() => {
    this.notificationsChanged.get();
    let subscription = this.subscribe('unreadNotifications');
    if (subscription.ready()) {
      let unreadedNotifications = Notifications.find({isReaded: false}, {sort: {createdAt: -1}, limit: 5}).fetch();
      let unreadedNotificationsIds = _.map(unreadedNotifications, function (notification) {
        return notification._id;
      });
      this.unreadedNotificationsIds.set(unreadedNotificationsIds);
    }
  });
});

Template.topNavBar.onRendered(function () {
  this.$('ul.tabs').tabs();
  $('.dropdown-button').dropdown();
  this.$('select').material_select();
  $(document).on('click', 'li.action .dropdown-content', function (e) {
    e.stopPropagation();
  });
  $(document).on('click', '#user-switch-dropdown', function (e) {
    e.stopPropagation();
  });

  this.autorun(() => {
    let inputFilter = this.inputFilter.get();
    let subscription = this.subscribe('companiesByNameRegExp', inputFilter, 25);
    if (subscription.ready()) {
      this.$('.collapsible').collapsible();
    }
  });
});

Template.topNavBar.helpers({
  profilePhoto() {
    let user = Meteor.user();
    if (!user || !user.profile) {
      return;
    }
    if (!user.profile.photo || !user.profile.photo.small) {
      return '/images/default-lockout.png'
    }

    return user.profile.photo.small;
  },

  unreadNotificationsCount() {
    return Template.instance().unreadNotificationsCount.get();
  },
  pageTitle() {
    let pageTitle = this.pageTitle;
    let routeName = Router.current().route.getName();
    if (routeName === 'projectDashboard') {
      let projectId = Router.current().params.id;
      let project = Projects.findOne(projectId);
      if (project) {
        let projectName = project && project.name;
        return 'Projects > ' + projectName;
      }
    }
    else {
      return pageTitle;
    }
  },
  unreadNotifications() {
    return Notifications.find({isReaded: false}, {sort: {createdAt: -1}, limit: 5}).fetch();
  },
  userCompanies() {
    let userId = Meteor.userId();
    let companiesCreatedByUser = Roles.getGroupsForUser(userId, 'company-owner');
    let companiesWhereUserAdmin = Roles.getGroupsForUser(userId, 'company-admin');
    let companiesWhereUserManager = Roles.getGroupsForUser(userId, 'company-manager');
    let companiesWhereUserWorker = Roles.getGroupsForUser(userId, 'company-worker');
    let companiesWhereUserObserver = Roles.getGroupsForUser(userId, 'company-observer');

    let relatedCompaniesDirectly = _.union(companiesCreatedByUser,
      companiesWhereUserAdmin,
      companiesWhereUserManager,
      companiesWhereUserWorker,
      companiesWhereUserObserver);

    let query = {isArchived: false};
    query._id = {$in: relatedCompaniesDirectly};

    let tmpl = Template.instance();
    let inputFilter = tmpl.inputFilter.get();
    if (inputFilter && inputFilter.length > 0) {
      let regEx = new RegExp(inputFilter, 'gi');
      query.name = {$regex: regEx};
    }

    if (tmpl.selectedCompanyId.get()) {
      let companyId = tmpl.selectedCompanyId.get();
      query._id = companyId;
      let selectedCompany = Companies.find(query, {sort: {name: 1}}).fetch();
      query._id = {$in: relatedCompaniesDirectly, $not: companyId};
      let anotherCompanies = Companies.find(query, {sort: {name: 1}, limit: 25}).fetch();

      let companies = [];

      companies.push(selectedCompany[0]);

      anotherCompanies.forEach(function (company) {
        companies.push(company);
      });
      return companies;

    } else {
      return Companies.find(query, {sort: {name: 1}, limit: 25}).fetch();
    }
  },
  selectedCompany() {
    let user = Meteor.user();
    return !!(user.profile && user.profile.selectedCompanyId);
  },
  firstChar() {
    let company = this;
    return company && company.name.charAt(0);
  },
  companyName() {
    let user = Meteor.user();
    let companyId = user.profile && user.profile.selectedCompanyId;
    let company = Companies.findOne({_id: companyId});
    return company && company.name;
  }
});
Template.topNavBar.onRendered(function () {

});
Template.topNavBar.events({
  'click .navbar-conversations-menu'(event, tmpl) {
    event.preventDefault();
    let parentNode = tmpl.$(event.target).closest('li')[0];
    Blaze.renderWithData(Template.topNavBarDropdownContainer, {
      templateToDisplay: 'conversationsDropdownContent'
    }, parentNode);
  },

  'click .btn-logout': function () {
    Accounts.logout();
  },
  'click #notification-dropdown'(event, tmpl) {
    event.stopPropagation();
  },
  'click .setting': function (event, tmpl) {
    event.preventDefault();
  },
  'click #mark-as-read': function (event, tmpl) {
    event.preventDefault();
    let id = [this._id];

    markNotifications.call({notificationsArray: id}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        console.log(message);
        VZ.notify('Failed to mark notification');
      } else {
        tmpl.notificationsChanged.set(!tmpl.notificationsChanged.get());
        VZ.notify('Notification read');
      }
    });
  },
  'click #clear-all-notifications'(event, tmpl) {
    event.preventDefault();
    markAllNotifications.call({}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        console.log(message);
        VZ.notify('Failed to mark notifications');
      } else {
        tmpl.notificationsChanged.set(!tmpl.notificationsChanged.get());
        VZ.notify('Notifications read');
      }
    });
  },
  'click #workers-view'(event, tmpl) {
    event.preventDefault();
    updateSelectedCompanyId.call({}, function (error, result) {
      if (error) {
        VZ.notify(error.message);
      }
    });
      updateSelectedJobId.call({}, function (error, result) {
          if (error) {
              VZ.notify(error.message);
          }
      });
  },
  'input #filter-company'(event, tmpl) {
    event.preventDefault();
    let str = tmpl.$('#filter-company').val();
    tmpl.inputFilter.set(str.trim());
  },
  'click #company'(event, tmpl) {
    event.preventDefault();
    let selectedCompanyId = this._id;
    /*const modalData = {
     actionsTemplate: 'companyCreateEditModalActions',
     headTemplate: 'companyCreateEditModalHead',
     headTemplateData: { companyId: this._id },
     detailsTemplate: 'companyCreateEditModalDetails',
     detailsTemplateData: { companyId: this._id },
     asideTemplate: 'companyCreateEditModalAside',
     asideTemplateData: { companyId: this._id }
     };
     Blaze.renderWithData(Template.rightDrawerModal, modalData, document.body);*/
    updateSelectedCompanyId.call({selectedCompanyId}, function (error, result) {
      if (error) {
        VZ.notify(error.message);
      }
      tmpl.selectedCompanyId.set(selectedCompanyId)
    });
      updateSelectedJobId.call({}, function (error, result) {
          if (error) {
              VZ.notify(error.message);
          }
      });
  },
  'click #manage-account'(event, tmpl) {
    event.preventDefault();
    let user = Meteor.users.findOne({_id: Meteor.userId()});
    let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
    if (selectedCompanyId) {
      const modalData = {
        actionsTemplate: 'companyCreateEditModalActions',
        headTemplate: 'companyCreateEditModalHead',
        headTemplateData: {companyId: selectedCompanyId},
        detailsTemplate: 'companyCreateEditModalDetails',
        detailsTemplateData: {companyId: selectedCompanyId},
        asideTemplate: 'companyCreateEditModalAside',
        asideTemplateData: {companyId: selectedCompanyId}
      };
      Blaze.renderWithData(Template.rightDrawerModal, modalData, document.body);
    }
    else {
      Router.go('userProfile', {id: Meteor.userId()});
    }
  },
  'click #view-profile'(event, tmpl) {
    event.preventDefault();
    Router.go('userProfile', {id: Meteor.userId()});
  }
});
