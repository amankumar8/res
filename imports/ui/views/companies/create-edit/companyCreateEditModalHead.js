import { Template } from 'meteor/templating';
import {Companies} from "../../../../api/companies/companies";
import {GoogleSearchboxController} from "./googleSearchBox/index";
import './googleSearchBox/googleSearchBox';
import './companyCreateEditModalHead.html'
import './logoFileInput'

Template.companyCreateEditModalHead.onCreated(function() {
  const modal = this.data.modalTemplate;
  const company = Companies.findOne(Template.instance().data.companyId, {fields: {location: 1, logoUrl: 1}});

  modal.GoogleSearchboxControllerInstance = new GoogleSearchboxController(company && company.location);
  modal.logoVar = new ReactiveVar(company && company.logoUrl);
  modal.currentLogoVar = new ReactiveVar(company && company.logoUrl);
  modal.idVar = new ReactiveVar();
});

Template.companyCreateEditModalHead.onRendered(function() {
  this.$('input').characterCounter();
});

Template.companyCreateEditModalHead.helpers({
  getTitle() {
    const company = Companies.findOne(Template.instance().data.companyId, {fields: {name: 1}});
    return company && company.name;
  },
  getGoogleSearchboxController() {
    const template = Template.instance();
    const modal = template.data.modalTemplate;
    return modal.GoogleSearchboxControllerInstance;
  },
  supplySetLogoFunction() {
    const template = Template.instance();
    const modal = template.data.modalTemplate;
    return function (logoObject) {
      modal.logoVar.set(logoObject);
    };
  },
  selectedCompanyId(){
    const template = Template.instance();
    return template.data && template.data.companyId;
  }
});

Template.companyCreateEditModalHead.events({

});
