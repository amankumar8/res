import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { VZ } from '/imports/startup/both/namespace';
import { _ } from 'meteor/underscore';
import { createContract, editContract } from '/imports/api/contracts/methods';
import {
  acceptContract,
  declineContract,
  pauseContract,
  endContract,
  continueContract
} from '/imports/api/contracts/methods';
import { isEdit, getUserRole, closeModal, checkContract } from './helpers';
import './contractCreateEditModalActions.html';

const oneSecond = 1000;

Template.contractCreateEditModalActions.onCreated(function () {
  const modal = this.data.modalTemplate;
  modal.areAsideVarsInitialized = new ReactiveVar(false);
  modal.currentStatusVar = new ReactiveVar();

  const areTabs = modal.data.useTabs;
  if (areTabs) {
    const tabsData = modal.tabsTemplateDataVar.get();
    modal.currentStatusVar.set(tabsData.details.asideTemplateData.status);
  }
});

Template.contractCreateEditModalActions.helpers({
  canAcceptOrDecline() {
    const modal = Template.instance().data.modalTemplate;
    modal.areAsideVarsInitialized.get();
    const areTabs = modal.data.useTabs;
    if (isEdit(modal, { areTabs }) && modal.currentWorkerVar && modal.currentStatusVar) {
      const workerId = modal.currentWorkerVar.get()._id;
      const status = modal.currentStatusVar.get();
      return status === 'pending' && workerId === Meteor.userId();
    }
    return false;
  },
  canPauseOrEnd() {
    const modal = Template.instance().data.modalTemplate;
    const areTabs = modal.data.useTabs;
    if (isEdit(modal, { areTabs }) && modal.currentStatusVar) {
      const status = modal.currentStatusVar.get();
      return status === 'active';
    }
    return false;
  },
  canContinue() {
    const modal = Template.instance().data.modalTemplate;
    const areTabs = modal.data.useTabs;
    if (isEdit(modal, { areTabs }) && modal.currentStatusVar) {
      const status = modal.currentStatusVar.get();
      return status === 'paused';
    }
    return false;
  }
});

Template.contractCreateEditModalActions.events({
  'click #save': _.debounce((event, template) => {
    event.preventDefault();
    event.stopPropagation();
    if (!document.getElementById('titleContractModal')) {
      return;
    }
    const modal = template.data.modalTemplate;
    const data = {
      name: $('#titleContractModal').val().trim(),
      workerId: modal.currentWorkerVar.get() && modal.currentWorkerVar.get()._id,
      companyId: modal.currentCompanyVar.get() && modal.currentCompanyVar.get()._id,
      projectIds: modal.currentProjectsVar.get().map(project => project._id),
      userRole: getUserRole(),
      paymentInfo: {
        weekHoursLimit: parseInt($('#week-hours-limit').val()),
        type:  $('#payment-type').val(),
        rate: parseFloat($('#payment-rate').val())
      }
    };
    checkContract(data);
    const areTabs = modal.data.useTabs;
    if (isEdit(modal, { areTabs })) {
      if (areTabs) {
        const details= modal.tabsTemplateDataVar.get().details;
        data._id = details.headTemplateData.contractId;
      } else {
        data._id = modal.data.headTemplateData.contractId;
      }
      editContract.call(data, (err, res) => {
        if (err) {
          console.error(err);
          VZ.notify(err.reason || err.message);
        } else {
          VZ.notify('Contract updated successfully');
          closeModal(modal);
        }
      });
    } else {
      createContract.call(data, (err, res) => {
        if (err) {
          console.error(err);
          VZ.notify(err.reason || err.message);
        } else {
          VZ.notify('Contract created successfully');
          closeModal(modal);
        }
      });
    }
  }, oneSecond),
  'click #acceptContract': function (event, template) {
    const modal = template.data.modalTemplate;
    const details = modal.tabsTemplateDataVar.get().details;
    const contractId = details.headTemplateData.contractId;
    acceptContract.call({ contractId }, function (err, res) {
      if (err) {
        console.error(err);
      } else {
        modal.currentStatusVar.set('active');
      }
    });
  },

  'click #declineContract': function (event, template) {
    const modal = template.data.modalTemplate;
    const details = modal.tabsTemplateDataVar.get().details;
    const contractId = details.headTemplateData.contractId;
    declineContract.call({ contractId }, function (err, res) {
      if (err) {
        console.error(err);
      } else {
        modal.currentStatusVar.set('declined');
      }
    });
  },

  'click #pauseContract': function (event, template) {
    const modal = template.data.modalTemplate;
    const details = modal.tabsTemplateDataVar.get().details;
    const contractId = details.headTemplateData.contractId;
    pauseContract.call({ contractId }, function (err, res) {
      if (err) {
        console.error(err);
      } else {
        modal.currentStatusVar.set('paused');
      }
    });
  },

  'click #endContract': function (event, template) {
    const modal = template.data.modalTemplate;
    const details = modal.tabsTemplateDataVar.get().details;
    const contractId = details.headTemplateData.contractId;
    endContract.call({ contractId }, function (err, res) {
      if (err) {
        console.error(err);
      } else {
        modal.currentStatusVar.set('ended');
      }
    });
  },

  'click #continueContract': function (event, template) {
    const modal = template.data.modalTemplate;
    const details = modal.tabsTemplateDataVar.get().details;
    const contractId = details.headTemplateData.contractId;
    continueContract.call({ contractId }, function (err, res) {
      if (err) {
        console.error(err);
      } else {
        modal.currentStatusVar.set('active');
      }
    });
  }
});
