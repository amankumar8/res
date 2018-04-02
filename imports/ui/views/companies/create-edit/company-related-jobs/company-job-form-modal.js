import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import {VZ} from '/imports/startup/both/namespace';

Template.companyJobFormModal.onCreated(function() {
  console.log('jobs form modal on created', this.data);
  this.timeFormat = VZ.Utils.TimeFormat.createdModified;
  this.currentJobVar = new ReactiveVar();
});

Template.companyJobFormModal.helpers({
  supplyGetElement() {
    const template = Template.instance();
    return function(selector) {
      return template.find(selector);
    }
  },
  getCompanyId() {
    return Template.instance().data.companyId;
  },
  getJobTitle() {
    const job = Template.instance().currentJobVar.get();
    return job && job.title;
  },
  getApplicantsCount() {
    const job = Template.instance().currentJobVar.get();
    return job && job.applicantsIds.length;
  },
  getStatus() {
    const job = Template.instance().currentJobVar.get();
    return job && job.status;
  },
  getCreatedAt() {
    const template = Template.instance();
    const job = template.currentJobVar.get();
    return job && job.createdAt && moment(job.createdAt).format(template.timeFormat);
  },
  getExpireAt() {
    const template = Template.instance();
    const job = template.currentJobVar.get();
    return job && job.expireAt && moment(job.expireAt).format(template.timeFormat);
  },
  getViewsCount() {
    const job = Template.instance().currentJobVar.get();
    return job && job.viewrsIds.length;
  }
});

Template.companyJobFormModal.events({
  'click .add': function(event, template) {
    const job = template.currentJobVar.get();
    template.data.jobsRelatedCollection.insert(job);
    template.currentJobVar.set({});
  },
  'click .clear': function(event, template) {
    template.currentJobVar.set({});
  },
  'click .cancel': function(event, template) {
    Blaze.remove(template.view);
  }
});