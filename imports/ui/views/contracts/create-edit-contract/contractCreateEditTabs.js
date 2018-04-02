import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './contractCreateEditTabs.html';

Template.contractCreateEditTabs.onCreated(function () {
  this.currentTabVar = new ReactiveVar('contractEditDetailsTab');
});

Template.contractCreateEditTabs.onRendered(function () {
  this.$('ul.tabs').tabs();
});

Template.contractCreateEditTabs.helpers({
  currentTab() {
    return Template.instance().currentTabVar.get();
  },
  currentTabData() {
    const template = Template.instance();
    if (template.currentTabVar.get() === 'contractEditDetailsTab') {
      template.data.details.headTemplateData = Object.assign(template.data.details.headTemplateData || {}, { modalTemplate: template.data.modalTemplate });
      template.data.details.detailsTemplataData = Object.assign(template.data.detailsTemplataData || {}, { modalTemplate: template.data.modalTemplate });
      template.data.details.asideTemplateData = Object.assign(template.data.details.asideTemplateData || {}, { modalTemplate: template.data.modalTemplate });
      return template.data.details;
    } else {
      return template.data.history;
    }
  }
});

Template.contractCreateEditTabs.events({
  'click .tabs > li': function (event, template) {
    template.currentTabVar.set(event.target.parentElement.dataset.template);
  }
});

