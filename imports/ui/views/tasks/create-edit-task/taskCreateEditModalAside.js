import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Projects } from '/imports/api/projects/projects';
import { VZ } from '/imports/startup/both/namespace'; 
import './taskCreateEditModalAside.html';

Template.taskCreateEditModalAside.onCreated(function () {
  const modal = this.data.modalTemplate;
  modal.projectVar = new ReactiveVar({}, (a,b) => a._id === b._id);
  modal.newTaskUserIds = new ReactiveVar([]);
  modal.newTaskFiles = new ReactiveVar([]);
  this.autorun(() => {
    this.subscribe('assignedUsers', modal.projectVar.get().assignedUsersIds || []);
    this.subscribe('projectsList', { owner: Meteor.userId(), archived: false }, { limit: 300 });
  });
});

Template.taskCreateEditModalAside.helpers({
  projectSearchParams() {
    const modal = Template.instance().data.modalTemplate;
    return {
      collection: Projects,
      subscription: {
        name: 'projectsByNameRegExpAlternative',
        limit: 20,
        addQuery: {},
        addOptions: { fields: { name: 1 } }
      },
      queryFieldName: 'name',
      fieldAccessor: 'name',
      buttonName: 'Select project',
      placeholder: 'Enter project name',
      class: 'projectSelector',
      setFunction(value) {
        modal.projectVar.set(value || {});
        modal.newTaskUserIds.set([]);
      },
      value: modal.projectVar.get()
    };
  },
  assignedUsersCount() {
    const newTaskUserIds = Template.instance().data.modalTemplate.newTaskUserIds;
    if (newTaskUserIds) {
      const count = newTaskUserIds.get().length;
      return count === 1 ? `${count} user` : `${count} users`;
    } else {
      return '0 users';
    }
  },
  attachedFilesCount() {
    const newTaskFiles = Template.instance().data.modalTemplate.newTaskFiles;
    if (newTaskFiles) {
      const count = newTaskFiles.get().length;
      return count === 1 ? `${count} file` : `${count} files`;
    } else {
      return '0 files';
    }
  }
});

Template.taskCreateEditModalAside.events({
  'click .modal-assign-users': function (event, template) {
    const modal = template.data.modalTemplate;
    const projectId = modal.projectVar.get()._id;
    if (!projectId) {
      VZ.notify('Please select project first');
      return;
    }
    let newTaskUserIds = modal.newTaskUserIds.get();
    const newTaskUserIdsVar = modal.newTaskUserIds;
    const modalData = {
      projectId,
      taskId: 'new-task',
      newTaskUserIdsVar,
      onUserAssignRemoveUserCb(userId, action) {
        if (action === 'assign') {
          newTaskUserIds.push(userId);
          modal.newTaskUserIds.set(newTaskUserIds);
        } else if (action === 'remove') {
          newTaskUserIds = newTaskUserIds.filter(id => id !== userId);
          modal.newTaskUserIds.set(newTaskUserIds);
        }
      }
    };
    Blaze.renderWithData(Template.assignUsersModal, modalData, document.body);
  },
  'click .modal-attach-files': function (event, template) {
    const modal = template.data.modalTemplate;
    const projectId = modal.projectVar.get()._id;
    if (!projectId) {
      VZ.notify('Please select project first');
      return;
    }
    let newTaskFiles = modal.newTaskFiles.get();
    const newTaskFilesVar = modal.newTaskFiles;
    const modalData = {
      projectId,
      taskId: 'new-task',
      newTaskFilesVar,
      onAddFilesCb(file) {
        newTaskFiles.push(file);
        modal.newTaskFiles.set(newTaskFiles);
      } 
    };
    Blaze.renderWithData(Template.taskAttachmentsModal, modalData, document.body);
  }
});
