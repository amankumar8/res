import './company-actions.html';
import {VZ} from '/imports/startup/both/namespace';
import {Meteor} from 'meteor/meteor'
import {archiveCompany, restoreCompany} from '/imports/api/companies/methods';

Template.companyActions.onRendered(function () {
  this.$('.dropdown-button').dropdown({
    inDuration: 100,
    outDuration: 125,
    constrain_width: false, // Does not change width of dropdown to that of the activator
    hover: false, // Activate on hover
    gutter: 0, // Spacing from edge
    // belowOrigin: false, // Displays dropdown below the button
    alignment: 'right' // Displays dropdown with edge aligned to the left of button
  });
});

Template.companyActions.helpers({
  canEditCompany() {
    return VZ.canUser('editCompany', Meteor.userId(), this.data._id);
  },
  canArchiveRestoreCompany() {
    return VZ.canUser('archiveCompany', Meteor.userId(), this.data._id);
  },
  canAssignUsers(){
    return VZ.canUser('assignUsersToCompany', Meteor.userId(), this.data._id);
  },
  isUnderCurrentCompany(){
    let user = Meteor.users.findOne({_id: Meteor.userId()});
    let selectedCompanyId = user.profile && user.profile.selectedCompanyId;
    let companyId = this.data && this.data._id;
    if(selectedCompanyId){
      return selectedCompanyId === companyId;
    }
    else {
      return true;
    }
  }
});

Template.companyActions.events({
  'click #archive-company': function (event, tmpl) {
    event.preventDefault();
    const companyId = this.data._id;
    Session.set('companiesFormChanged', false);

    archiveCompany.call({id: companyId}, function (error, result) {
      if (!error) {
        VZ.notify('Archived');
        Session.set('companiesFormChanged', true);
      }
      else {
        VZ.notify(error.message);
        Session.set('companiesFormChanged', true);
      }
    });
  },
  'click #restore-company': function (event, tmpl) {
    event.preventDefault();
    const companyId = this.data._id;
    Session.set('companiesFormChanged', false);
    restoreCompany.call({companyId}, function (error, result) {
      if (!error) {
        VZ.notify('Restored');
        Session.set('companiesFormChanged', true);
      }
      else {
        VZ.notify(error.message);
        Session.set('companiesFormChanged', true);
      }
    });
  },
  'click #edit-company': function (event, template) {
    event.preventDefault();
    let companyId = this.data && this.data._id;

    const modalData = {
      generalClass: 'createModal',
      actionsTemplate: 'companyCreateEditModalActions',
      headTemplate: 'companyCreateEditModalHead',
      headTempalteData: { companyId: companyId },
      detailsTemplate: 'companyCreateEditModalDetails',
      detailsTemplataData: { companyId: companyId },
      asideTemplate: 'companyCreateEditModalAside',
      asideTemplateData: { companyId: companyId },
    };
    Blaze.renderWithData(Template.rightDrawerModal, modalData, document.body);
    return true;
  }
});