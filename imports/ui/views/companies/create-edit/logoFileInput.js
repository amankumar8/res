import { Template } from 'meteor/templating';
import {Companies} from "../../../../api/companies/companies";
import { VZ } from '/imports/startup/both/namespace';
import { updateCompanyLogo } from '/imports/api/companies/methods';

import './logoFileInput.html'

Template.logoFileInput.onCreated(function () {
  this.uploadCompanyLogo = (file) => {
    let reader = new FileReader();
    reader.onload = (event) => {
      let buffer = new Uint8Array(reader.result);
      this.data.setLogoVar({buffer: buffer, type: file.type});
    };
    reader.readAsArrayBuffer(file);
  };
});

Template.logoFileInput.events({
  'change #logo': function(event, template) {
    event.preventDefault();
    let file = $(event.target).prop('files')[0];
    if (!photoValidation(file)) {
      return;
    }
    template.uploadCompanyLogo(file);
  }
});

Template.logoFileInput.helpers({
  getLogoUrl() {
    const company = Companies.findOne(Template.instance().data.selectedCompanyId, {fields: {logoUrl: 1}});
    return company && company.logoUrl || 'http://santetotal.com/wp-content/uploads/2014/05/default-user.png';
  }
});


let photoValidation = function (file) {
  if (!file) {
    return;
  }
  if (file.size >= 5 * 1000000) {
    VZ.notify('File too large! Limit 5MB');
    $('#logo').val('');
    return
  }
  let typeRegEx = /^image\/(jpeg|JPEG|png|PNG|gif|GIF|tif|TIF)$/;
  if (!typeRegEx.test(file.type)) {
    VZ.notify('Wrong file type! Allowed jpeg, png, gif, tif');
    $('#logo').val('');
    return
  }
  return true
};