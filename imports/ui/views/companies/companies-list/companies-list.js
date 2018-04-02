import './companies-list.html';
import './all-companies/all-companies';
import  './archived-companies/archived-companies';

Template.companiesList.onCreated(function () {
  this.currentTab = new ReactiveVar('allCompanies');
});

Template.companiesList.onRendered(function () {
  this.$('ul.tabs').tabs();
});

Template.companiesList.helpers({
  tab() {
    return Template.instance().currentTab.get();
  },
  formChanged() {
    return Session.get('companiesFormChanged');
  },
  accent(tab) {
    if(tab === Template.instance().currentTab.get()) {
      return 'tab-accent-white';
    }
  },
  active(tab) {
    if(tab === Template.instance().currentTab.get()) {
      return 'active';
    }
  }
});

Template.companiesList.events({
  'click .tab': function(event, template) {
    let a = event.target;
    if(a.innerText === 'ALL') {
      template.currentTab.set('allCompanies');
    } else if(a.innerText === 'ARCHIVED') {
      template.currentTab.set('archivedCompanies');
    }
  }
});