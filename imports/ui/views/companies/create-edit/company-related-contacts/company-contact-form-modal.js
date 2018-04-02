import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import {VZ} from '/imports/startup/both/namespace';
import {Contacts} from '/imports/api/companies/companies';

Template.companyContactFormModal.onCreated(function() {
  //console.log('contact form modal', this.data);
});

Template.companyContactFormModal.helpers({
  supplyGetElement() {
    const template = Template.instance();
    return function(selector) {
      return template.find(selector);
    }
  },
  getCompanyId() {
    return Template.instance().data.companyId;
  }
});

Template.companyContactFormModal.events({
  'click .add': function(event, template) {
    event.preventDefault();
    const _id = template.find('#firstName').dataset.id;
    const firstName = template.find('#firstName').value;
    const lastName = template.find('#lastName').value;
    const email = template.find('#email').value;
    const phone = template.find('#phone').value;
    checkContact(_id, firstName, lastName, email, phone);
    const data = {
      _id: _id ? _id : Random.id(),
      firstName,
      lastName,
      email,
      phone
    };
    template.data.contactsRelatedCollection.insert(data);
    renderContactsTable(template.data.contactsRelatedCollection);
    template.find('#firstName').dataset.id = "";
    template.find('#firstName').value = "";
    template.find('#lastName').value = "";
    template.find('#email').value = "";
    template.find('#phone').value = "";
    Blaze.remove(template.view);
  },
  'click .clear':function(event, template) {
    event.preventDefault();
    template.find('#firstName').dataset.id = "";
    template.find('#firstName').value = "";
    template.find('#lastName').value = "";
    template.find('#email').value = "";
    template.find('#phone').value = "";
    template.find('#firstName').disabled = false;
    template.find('#lastName').disabled = false;
    template.find('#email').disabled = false;
    template.find('#phone').disabled = false;
  },
  'click .cancel': function(event, template) {
    Blaze.remove(template.view);
  }
});

function checkContact(_id, firstName, lastName, email, phone) {
  if(!firstName || !lastName) {
    VZ.notify('first name and last name are required');
    throw 'first name and last name are required';
  } else if(!_id && email && Contacts.findOne({email}, {fields: {_id: 1}})) {
    VZ.notify('contact with such email already exists');
    throw `contact ${email} already exists`;
  }
}

function renderContactsTable(contactsRelatedCollection) {
  const tableAnchor = document.getElementsByClassName('contactsTableAnchor')[0];
  const table = document.getElementById('contacts-table');
  const tableView = Blaze.getView(table);
  const data = {
    contacts: contactsRelatedCollection.find().fetch()
  };
  tableAnchor.style.visibility = 'hidden';
  Blaze.remove(tableView);
  Blaze.renderWithData(Template.companyFormContactTable, data, tableAnchor);
  setTimeout(() => tableAnchor.style.visibility = "", 500);
}
