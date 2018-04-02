import { Template } from 'meteor/templating';
import { getDataTableOptions, DOM } from 'meteor/vezio-back-office:utils';

Template.companyFormContactsTable.onRendered(function() {
  $('#contacts-table').DataTable(getDataTableOptions(4));
});

Template.companyFormContactsTable.events({
  'click #table_search': function(event, template) {
    DOM.toggleClass(template.find('#contacts-table_filter'), 'active');
    DOM.toggleClass(template.find('#table_search'), 'active');
    DOM.toggleClass(template.find('.addContactModalButton'), 'active');
  }
});
