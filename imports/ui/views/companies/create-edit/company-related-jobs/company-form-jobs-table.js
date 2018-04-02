import { Template } from 'meteor/templating';
import { getDataTableOptions, DOM } from 'meteor/vezio-back-office:utils';
import {VZ} from '/imports/startup/both/namespace';

Template.companyFormJobsTable.onCreated(function() {
  this.timeFormat = VZ.Utils.TimeFormat.createdModified;
});

Template.companyFormJobsTable.onRendered(function() {
  $('#jobs-table').DataTable(getDataTableOptions(6));
});

Template.companyFormJobsTable.helpers({
  getApplicantsCount() {
    return this.applicantsIds.length;
  },
  getCreatedAt() {
    if(this.createdAt) {
      return moment(this.createdAt).format(Template.instance().timeFormat);
    }
  },
  getExpiredAt() {
    if(this.expireAt) {
      return moment(this.expireAt).format(Template.instance().timeFormat);
    }
  },
  getViewsCount() {
    if(this.viewerIds) {
      return this.viewerIds.length;
    } else if(this.viewersIds) {
      return this.viewersIds.length;
    }
  }
});

Template.companyFormJobsTable.events({
  'click #table_search': function(event, template) {
    DOM.toggleClass(template.find('#jobs-table_filter'), 'active');
    DOM.toggleClass(template.find('#table_search'), 'active');
    //DOM.toggleClass(template.find('#addJobModalButton'), 'active');
  }
});
