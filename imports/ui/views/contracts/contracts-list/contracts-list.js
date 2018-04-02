import './contracts-list.html';
import './active-contracts/active-contracts';
import './contracts-list-item/contracts-list-item';
import './ended-contracts/ended-contracts';
import './paused-contracts/paused-contracts';
import './pending-contracts/pending-contracts';

Template.contractsList.onCreated(function () {
  this.currentTab = new ReactiveVar('activeContracts');
});

Template.contractsList.onRendered(function () {
  this.$('ul.tabs').tabs();
});

Template.contractsList.helpers({
  tab() {
    return Template.instance().currentTab.get();
  },
  formChanged() {
    return Session.get('contractsFormChanged');
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

Template.contractsList.events({
  'click .tab': function (event, template) {
    let a = event.target;
    if (a.innerText === 'ACTIVE') {
      template.currentTab.set('activeContracts');
    } else if (a.innerText === 'PENDING') {
      template.currentTab.set('pendingContracts');
    } else if (a.innerText === 'PAUSED') {
      template.currentTab.set('pausedContracts');
    } else if (a.innerText === 'COMPLETED') {
      template.currentTab.set('endedContracts');
    }
  }
});