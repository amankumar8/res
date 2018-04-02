import { Template } from 'meteor/templating';
import './contractEditDetailsTab.html';

Template.contractEditDetailsTab.helpers({
  getHeadTemplateData() {
    return Template.instance().data.headTemplateData;
  },
  getDetailsTemplateData() {
    return Template.instance().data.detailsTemplataData;
  },
  getAsideTemplateData() {
    return Template.instance().data.asideTemplateData;
  }
});