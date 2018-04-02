import { VZ } from '/imports/startup/both/namespace';
import { _ } from 'meteor/underscore';
import { createTask } from '/imports/api/tasks/methods';
import { checkTask, closeModal } from './helpers.js';
import './taskCreateEditModalActions.html';

const oneSecond = 1000;

Template.taskCreateEditModalActions.events({
  'click #save': _.debounce((event, template) => {
    event.preventDefault();
    event.stopPropagation();
    const modal = template.data.modalTemplate;
    const data = {
      name: document.getElementById('titleTaskModal').value.trim(),
      description: document.getElementsByClassName('modal-description')[0].value.trim(),
      projectId: modal.projectVar.get()._id,
      membersIds: modal.newTaskUserIds.get(),
      taskFiles: modal.newTaskFiles.get()
    };
    checkTask(data);
    createTask.call({ task: data }, (err, res) => {
      if (err) {
        console.error(err);
        VZ.notify(err.reason || err.message);
      } else {
        VZ.notify('Task created successfully');
        closeModal(modal);
      }
    });
  }, oneSecond),
});
