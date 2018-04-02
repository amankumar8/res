import {Contracts} from '/imports/api/contracts/contracts';
import './dashboard-card-active.html';

Template.dashboardCardActive.onCreated(function () {
  this.query = new ReactiveVar({_id: 'dummyId'});
  this.autorun(() => {
    Template.currentData();
    let user = Meteor.user();
    let companyId = user.profile && user.profile.selectedCompanyId;
    let sub = this.subscribe('ownerContracts', true, companyId);
    if(sub.ready()){
      let contracts = Contracts.find({employerId: Meteor.userId(), companyId: companyId}).fetch();
      let workersIds = _.map(contracts, function (contract) {
        return contract.workerId;
      });
      let users = Meteor.users.find({_id: {$in: workersIds}}).fetch();

      let usersLastEntries = [];
      let usersCurrentEntries = [];
      users.forEach((user) => {
        if (user && user.profile && user.profile.entryId) {
          usersCurrentEntries.push(user.profile.entryId);
        }
        if (user && user.profile && user.profile.lastWorkedEntryId && !user.profile.entryId) {
          usersLastEntries.push(user.profile.lastWorkedEntryId);
        }
      });

      this.query.set({usersLastEntries, usersCurrentEntries});
    }
  });
  this.setQueryForUser = (userId) => {
    let usersLastEntries = [];
    let usersCurrentEntries =[];
    let user = Meteor.users.findOne({_id: userId});
    if (user && user.profile && user.profile.entryId) {
      usersCurrentEntries.push(user.profile.entryId);
    }
    if (user && user.profile && user.profile.lastWorkedEntryId && !user.profile.entryId) {
      usersLastEntries.push(user.profile.lastWorkedEntryId);
    }
    this.query.set({usersLastEntries, usersCurrentEntries});
  };
});

Template.dashboardCardActive.onRendered(function () {
  this.$('.dropdown-button').dropdown();
});

Template.dashboardCardActive.helpers({
  query() {
    return Template.instance().query.get();
  },
  contractedUsers() {
    let contracts = Contracts.find({employerId: Meteor.userId()}).fetch();
    let workersIds = _.map(contracts, function (contract) {
      return contract.workerId;
    });
    return Meteor.users.find({_id: {$in: workersIds}}).fetch();
  },
  showUsers() {
    let tmpl = Template.instance();
    return tmpl.data.content;
  }
});

Template.dashboardCardActive.events({
  'change input[type=radio]': function (event, tmpl) {
    event.preventDefault();
    let name = event.target.className;
      if (name === 'assigned-to-me') {
        tmpl.setQueryForUser(Meteor.userId());
      }
      else if (name === 'all-active-tasks') {
        let user = Meteor.user();
        let companyId = user.profile && user.profile.selectedCompanyId;
        let contracts = Contracts.find({employerId: Meteor.userId(), companyId: companyId}).fetch();
        let workersIds = _.map(contracts, function (contract) {
          return contract.workerId;
        });
        let users = Meteor.users.find({_id: {$in: workersIds}}).fetch();
        let usersLastEntries = [];
        let usersCurrentEntries = [];
        users.forEach((user) => {
          if (user && user.profile && user.profile.entryId) {
            usersCurrentEntries.push(user.profile.entryId);
          }
          if (user && user.profile && user.profile.lastWorkedEntryId && !user.profile.entryId) {
            usersLastEntries.push(user.profile.lastWorkedEntryId);
          }
        });

        tmpl.query.set({usersLastEntries, usersCurrentEntries});
      }
      else {
        tmpl.setQueryForUser(name);
      }
  },
  'click .dropdown-content': function (event, tmpl) {
    event.stopPropagation();
  }
});
