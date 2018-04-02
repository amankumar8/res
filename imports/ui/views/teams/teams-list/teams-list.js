import './team-item/team-item';
import './all-teams';
import './archived-teams';
import './teams-list.html';

Template.teamsList.onCreated(function () {
  this.currentTab = new ReactiveVar('allTeams');
});

Template.teamsList.onRendered(function () {
  this.$('ul.tabs').tabs();
});

Template.teamsList.helpers({
  tab() {
    return Template.instance().currentTab.get();
  },
  formСhanged() {
    return Session.get('teamsFormChanged');
  },
  accent(tab) {
    if (tab === Template.instance().currentTab.get()) {
      return 'tab-accent-white';
    }
  },
  active(tab) {
    if (tab === Template.instance().currentTab.get()) {
      return 'active';
    }
  }
});

Template.teamsList.events({
  'click .tab': function(event, template) {
    let a = event.target;
    if(a.innerText === 'ALL') {
      template.currentTab.set('allTeams');
    } else if(a.innerText === 'ARCHIVED') {
      template.currentTab.set('archivedTeams');
    }
  }
});