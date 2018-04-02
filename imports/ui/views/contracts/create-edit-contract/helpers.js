import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Roles } from 'meteor/alanning:roles';
import { VZ } from '/imports/startup/both/namespace';


export const isEdit = function (modal, flags) {
  if (flags) {
    if (flags.areTabs) {
      const modalDetails = modal.tabsTemplateDataVar.get().details;
      return modalDetails.headTemplateData && !!modalDetails.headTemplateData.contractId;
    }
  }
  return !!modal.data.headTemplateData && !!modal.data.headTemplateData.contractId;
};

export const getUserRole = function () {
  const roles = Array.from(document.getElementsByName('user-role'));
  const checkedRoles = roles.filter(role => role.checked === true);
  if (checkedRoles.length === 0) {
    VZ.notify('User role is required');
    throw new Error('verification error', 'user role is required');
  } else if (checkedRoles.length > 1) {
    throw new Error('verification error', 'More than two roles checked');
  }
  return checkedRoles[0].value;
};

export const closeModal = function (modal) {
  $('.modal').modal('close');
  Blaze.remove(modal.view);
};

export const checkContract = function (data) {
  if (!data) {
    throw new Error('verification error', 'contract object not present');
  } else if (!data.name) {
    VZ.notify('Contract name is required');
    throw new Error('verification error', 'contract name is required');
  } else if (!data.workerId) {
    VZ.notify('Please choose worker');
    throw new Error('verification error', 'worker is reuqired');
  } else if (!data.projectIds && !Array.isArray(data.projectIds)) {
    throw new Error('verification error', 'projectIds array not defined');
  } else if (data.projectIds.length === 0 ) {
    VZ.notify('Choose at least one project');
    throw new Error('verification error', 'projectIds array is empty');
  } else if (!data.paymentInfo) {
    throw new Error('verificaiton error', 'paymentInfo property is not defined');
  } else if (!data.paymentInfo.weekHoursLimit) {
    VZ.notify('Please specify week hours limit');
    throw new Error('verification error', 'week hours limit is required');
  } else if (data.paymentInfo.weekHoursLimit < 0 || data.paymentInfo.weekHoursLimit > 100) {
    VZ.notify('Week hours limit must be positive number from 0 to 100');
    throw new Error('verification error', 'week hours limit not in range');
  } else if (data.paymentInfo.weekHoursLimit % 1 > 0) {
    VZ.notify('Week hours limit must be an integer');
    throw new Error('verification error', 'week hours limit is not an integer');
  } else if (!data.paymentInfo.rate) {
    VZ.notify('Please specify payment rate');
    throw new Error('verification error', 'payment rate is required');
  } else if (data.paymentInfo.rate < 0 || data.paymentInfo.rate > 999999) {
    VZ.notify('Payment rate must be positive number from 0 to 999999');
    throw new Error('verification error', 'payment rate not in range');
  }
};

export const getAllowedCompanyIds = function () {
  const companiesWhereUserIsManager = Roles.getGroupsForUser(Meteor.userId(), 'company-manager');
  const companiesWhereUserIsAdmin = Roles.getGroupsForUser(Meteor.userId(), 'company-owner');
  return companiesWhereUserIsManager.concat(companiesWhereUserIsAdmin);
};

export const determineUserRole = function (workerId, projectIds) {
  const projectsWhereUserIsWorker = Roles.getGroupsForUser(workerId, 'project-worker');
  for (let x = 0, count = projectIds.length; x < count; x++) {
    if (projectsWhereUserIsWorker.includes(projectIds[x])) {
      return 'project-worker';
    }
  }
  return 'project-observer';
};
