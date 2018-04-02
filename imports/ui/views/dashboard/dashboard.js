import './dashboard.html';
import './card/card';
import './card-content/card-content';
import './my-dashboard/my-dashboard';
import './workers-dashboard/workers-dashboard';
import {updateTaskTrackingInfoAndroid} from '/imports/api/tasks/methods';
import { VZ } from '/imports/startup/both/namespace';

Template.dashboard.onCreated(function () {
});

Template.dashboard.onRendered(function () {
  this.$('ul.tabs').tabs();
});

Template.dashboard.helpers({
  tab() {
    let user = Meteor.user();
    return user.profile && user.profile.selectedCompanyId ? 'workersDashboard' : 'myDashboard';
  },
  isCompanyAccount(){
    let user = Meteor.user();
    return user.profile && user.profile.selectedCompanyId;
  }
});

Template.dashboard.events({
  'click .createContract': function (event, template) {
      const modalData = {
          generalTemplate: 'contractCreateModalCentre'
      };
      Blaze.renderWithData(Template.centreCreateModal, modalData, $('body')[0]);
      ga('send', 'event', 'create-contract', 'vezio-work');
      return true;
  },
    'click .createProject': function (event, template) {
        const modalData = {
            generalTemplate: 'projectCreateModalCentre'
        };
        Blaze.renderWithData(Template.centreCreateModal, modalData, $('body')[0]);
        ga('send', 'event', 'create-project', 'vezio-work');
        return true;
    },
    'click .createJob': function (event, template) {
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
        if (selectedCompanyId) {
            const modalData = {
                generalTemplate: 'jobCreateModalCentre'
            };
            Blaze.renderWithData(Template.centreCreateModal, modalData, $('body')[0]);
            ga('send', 'event', 'post-new-job', 'vezio-work');
            return true;
        }
    },
    'click .createTask': function (event, template) {

        const modalData = {
            generalTemplate: 'taskCreateModalCentre'
        };
        Blaze.renderWithData(Template.centreCreateModal, modalData, $('body')[0]);
        ga('send', 'event', 'create-task', 'vezio-work');
        return true;

    },
    'click .createCompany': function (event, template) {
        const modalData = {
            generalClass: 'createModal',
            actionsTemplate: 'companyCreateEditModalActions',
            headTemplate: 'companyCreateEditModalHead',
            headTempalteData: void 0,
            detailsTemplate: 'companyCreateEditModalDetails',
            detailsTemplataData: void 0,
            asideTemplate: 'companyCreateEditModalAside',
            asideTemplateData: void 0
        };
        Blaze.renderWithData(Template.rightDrawerModal, modalData, document.body);
       ga('send', 'event', 'create-company', 'vezio-work');
       return true;
    }
});
