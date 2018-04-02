import { Template } from 'meteor/templating';
import {Companies} from "../../../../api/companies/companies";
import { Meteor } from 'meteor/meteor';
import './companyCreateEditModalAside.html'


Template.companyCreateEditModalAside.onCreated(function () {
  const modal = this.data.modalTemplate;

  const company = Companies.findOne(Template.instance().data.companyId, {fields: {location: 1, logoUrl: 1, ownerId:1}});
  modal.currentOwnerVar = new ReactiveVar((company && company.ownerId) || Meteor.userId());
  modal.idVar = new ReactiveVar();

  modal.idVar.set(Template.instance().data.companyId);

});

Template.companyCreateEditModalAside.helpers({
  getEmailModal() {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {contacts: 1}});

          if(company && company.contacts) {
              if (company.contacts.emails) {
                  const emails = company.contacts.emails;
                  return emails instanceof Array ? emails.length > 0 && emails[0] : emails;
              } else if (company.contacts.email) {
                  return company.contacts.email;
              }

          }


          },
  getPhoneModal() {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {contacts: 1}});
    if(company && company.contacts) {
        if(company.contacts.phones) {
            const phones = company.contacts.phones;
            return phones instanceof Array ? phones.length > 0 && phones[0] : phones;
        } else if(company.contacts.phone) {
            return company.contacts.phone;
        }
    }
  },
  getOwnerEmail() {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {ownerId: 1}});
    return company && company.getOwner();
  },
  getVat() {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {vat: 1}});
    return company && company.vat;
  },
  getRegistrationNumber() {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {registrationNumber: 1}});
    return company && company.registrationNumber;
  },
  getWebsite() {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {contacts: 1}});
    return company && company.contacts && company.contacts.website;
  },
  getYear() {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {year: 1}});
    return company && company.year;
  },
  employeesCountOptions() {
    return [
      'Self-employed',
      '1-10 employees',
      '11-50 employees',
      '51-200 employees',
      '201-500 employees',
      '501-1000 employees',
      '1001-5000 employees',
      '5001-10,000 employees',
      '10,001+ employees'
    ];
  },
  isEmployeesCountSelected() {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {employeesCount: 1}});
    return company && (this.valueOf() === company.employeesCount);
  },
  socialMedia () {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {socialMedias: 1, socialMedia: 1}});
      if(company.socialMedia) {
          if(company.socialMedia) {
              return company.socialMedia();
          } else if(company.socialMedias) {
              return company.socialMedias;
          }
      }
  },
  getSocialMediaController() {
    return Template.instance().SocialMediaControllerInstance;
  }
});

Template.companyCreateEditModalAside.events({
  'click .ownerSelector .filled-in': function (event, template) {
    template.data.modalTemplate.currentOwnerVar.set(event.target.id);
  }
});
