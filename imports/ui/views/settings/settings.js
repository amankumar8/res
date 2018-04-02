import './billing/billing';
import './general/general';
import './notifications/notifications';
import './security/security';
import './settings.html';
Template.settings.onCreated(function () {
  this.currentTab = new ReactiveVar('generalSettings');
});

Template.settings.onRendered(function () {
  this.$('ul.tabs').tabs();
});

Template.settings.helpers({
  tab() {
    return Template.instance().currentTab.get();
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

Template.settings.events({
  'click .tab': function(event, template) {
    let a = event.target;
    if(a.innerText === 'GENERAL') {
      template.currentTab.set('generalSettings');
    } else if(a.innerText === 'BILLING') {
      template.currentTab.set('billingSettings');
    }else if(a.innerText === 'NOTIFICATIONS') {
      template.currentTab.set('notificationSettings');
    }else if(a.innerText === 'SECURITY') {
      template.currentTab.set('securitySettings');
    }
  }
});