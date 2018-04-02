import { Blaze } from 'meteor/blaze';
import { VZ } from '/imports/startup/both/namespace';

export const closeModal = function (modal) {
  $('.modal').modal('close');
  Blaze.remove(modal.view);
};

export const checkTask = function (data) {
  if (!data) {
    throw new Error('verification error', 'task data object not present');
  } else if (!data.name) {
    VZ.notify('name is required');
    throw new Error('verification error', 'task name is required');
  } else if (!data.projectId) {
    VZ.notify('project not specified');
    throw new Error('verification error', 'project is not defined');
  }
};
