import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import './companyCreateEditModalActions.html'
import { addCompany, editCompany } from '/imports/api/companies/methods';
import { VZ } from '/imports/startup/both/namespace';

export const arrayFromValue = function(value) {
    if(value) {
        return value.split(',');
    } else {
        return [];
    }
};
Template.companyCreateEditModalActions.onCreated(function () {
  this.autorun(() => {
    let data = Template.currentData();
    let companyId = data.modalTemplate && data.modalTemplate.data && data.modalTemplate.data.asideTemplateData && data.modalTemplate.data.asideTemplateData.companyId;
    if(companyId){
      this.subscribe('companyById', companyId);
    }
  });
});

Template.companyCreateEditModalActions.events({
  'click #save': _.debounce(function (event, template) {
    const modal = template.data.modalTemplate;
    const name = $('#companyNameModal').val().trim();
    const ownerId = modal.currentOwnerVar.get();
    const employeesCount = $('#employeesCountModal').val();
    const vat = $('#vatModal').val().trim();
    const emails = arrayFromValue($('#emailModal').val().trim());
    const phones = arrayFromValue($('#phoneModal').val().trim());
    const website = $('#websiteModal').val().trim();
    const year = $('#yearModal').val().trim();
    const registrationNumber = $('#registrationNumberModal').val().trim();
      let logoUrl = null;
      let logo = null;
    if (typeof modal.logoVar.get() === 'string') {
        logoUrl =  modal.logoVar.get();
    } else {
        logo = modal.logoVar.get();
    }
    let location;
    if(typeof modal.GoogleSearchboxControllerInstance._location === 'object'){
      location = modal.GoogleSearchboxControllerInstance._location;
    }
    else {
      location = modal.GoogleSearchboxControllerInstance._location.get();
    }
    const socialMedia = modal.SocialMediaControllerInstance.socialMedia;
    let contacts = {};

    contacts.emails = emails;
    contacts.phones = phones;
    contacts.website = website;
    const jobsRelated = [];
    const contactsRelated = [];
    const data = {
      name,
      ownerId,
      employeesCount,
      vat,
      contacts,
      year,
      registrationNumber,
      logo,
        logoUrl,
      location,
      socialMedia,
      contactsRelated,
      jobsRelated
    };

      if (template.data.modalTemplate.data && template.data.modalTemplate.data.asideTemplateData && template.data.modalTemplate.data.asideTemplateData.companyId) {
        data._id = template.data.modalTemplate.data.asideTemplateData.companyId;
          editCompany.call(data, (err, res) => {
              if (err) {
                  let message = err.reason || err.message;
                  VZ.notify(message);
              } else {
                  VZ.notify('Company  ' + name + '  successfully updated!');
                  $('.modal').modal('close');
                  Blaze.remove(template.view);
              }
          });

      } else {
          addCompany.call(data, (err, res) => {
              if (err) {
                  let message = err.reason || err.message;
                  VZ.notify(message);
              } else {
                  VZ.notify('Company  ' + name + '  successfully created!');
                  $('.modal').modal('close');
                  Blaze.remove(template.view);
              }
          });
      }


  }, 1000)
});


function checkCompany(data) {
  if(!data) {
    throw 'company data object is not defined';
  } else if(!data.name) {
    VZ.notify('name is required');
    throw 'name is required';
  } else if(data.name.length < 2) {
    VZ.notify('name must be at least 2 characters');
    throw 'name must be at least 2 characters';
  } else if(data.name.length > 50) {
    VZ.notify('name must be at most 50 characters');
    throw 'name must be at most 50 characters';
  } else if(!data.ownerId) {
    throw 'owner is required';
  } else if(!data.employeesCount) {
    throw 'number of employees is required';
  } else if(data.vat && VZ.Constants.COMPANY_VAT_REGEX.test(data.vat) === false) {
    VZ.notify('vat is not correct');
    throw 'vat is not correct';
  } else if(data.registrationNumber && VZ.Constants.COMPANY_REGITRATION_NUMBER_REGEX.test(data.registrationNumber) === false) {
    VZ.notify('registration number is not correct');
    throw 'registration number is not correct';
  } else if(!data.location) {
    throw 'location property in company data object is not defined';
  } else if(!data.location.address) {
    VZ.notify('address is required');
    throw 'address is required';
  } else if(!data.location.country) {
    VZ.notify('type location and press enter or choose from the list');
    throw 'country is required';
  } else if(data.emails && checkEmails(data.emails) === false) {
    VZ.notify('Enter valid emails');
    throw 'enter valid email';
  }
}