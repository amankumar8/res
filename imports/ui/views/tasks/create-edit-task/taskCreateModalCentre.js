import './taskCreateModalCentre.html'

import {Meteor} from 'meteor/meteor';
import {Companies} from '/imports/api/companies/companies';
import {createProject} from '/imports/api/projects/methods';

import { VZ } from '/imports/startup/both/namespace';
import { _ } from 'meteor/underscore';
import { createTask } from '/imports/api/tasks/methods';
import { checkTask, closeModal } from './helpers.js';


import { ReactiveVar } from 'meteor/reactive-var';
import { Projects } from '/imports/api/projects/projects';

Template.taskCreateModalCentre.onCreated(function () {

    this.currentCompanyVar = new ReactiveVar({});
    this.tags = new ReactiveVar(false);

    this.projectVar = new ReactiveVar({}, (a,b) => a._id === b._id);
    this.newTaskUserIds = new ReactiveVar([]);
    this.newTaskFiles = new ReactiveVar([]);
    this.autorun(() => {
        this.subscribe('assignedUsers', this.projectVar.get().assignedUsersIds || []);
        this.subscribe('projectsList', { owner: Meteor.userId(), archived: false }, { limit: 300 });
    });
});

Template.taskCreateModalCentre.onRendered(function () {
    $('select').material_select();
    this.$('input').characterCounter();
    let self = this;

    this.$('.modal').modal();
    this.$('.modal').modal('open');
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
});

Template.taskCreateModalCentre.helpers({
    projectSearchParams() {
        const tmpl = Template.instance();
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
                tmpl.projectVar.set(value || {});
                tmpl.newTaskUserIds.set([]);
            },
            value: tmpl.projectVar.get()
        };
    },
    assignedUsersCount() {
        const newTaskUserIds = Template.instance().newTaskUserIds;
        if (newTaskUserIds) {
            const count = newTaskUserIds.get().length;
            return count === 1 ? `${count} user` : `${count} users`;
        } else {
            return '0 users';
        }
    },
    attachedFilesCount() {
        const newTaskFiles = Template.instance().newTaskFiles;
        if (newTaskFiles) {
            const count = newTaskFiles.get().length;
            return count === 1 ? `${count} file` : `${count} files`;
        } else {
            return '0 files';
        }
    }
});

Template.taskCreateModalCentre.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.taskCreateModalCentre.events({
    'click .modal-assign-users': function (event, template) {
        const projectId = template.projectVar.get()._id;
        if (!projectId) {
            VZ.notify('Please select project first');
            return;
        }
        let newTaskUserIds = template.newTaskUserIds.get();
        const newTaskUserIdsVar =template.newTaskUserIds;
        const modalData = {
            projectId,
            taskId: 'new-task',
            newTaskUserIdsVar,
            onUserAssignRemoveUserCb(userId, action) {
                if (action === 'assign') {
                    newTaskUserIds.push(userId);
                    template.newTaskUserIds.set(newTaskUserIds);
                } else if (action === 'remove') {
                    newTaskUserIds = newTaskUserIds.filter(id => id !== userId);
                    template.newTaskUserIds.set(newTaskUserIds);
                }
            }
        };
        Blaze.renderWithData(Template.assignUsersModal, modalData, document.body);
    },
    'click .modal-attach-files': function (event, template) {
        const projectId = template.projectVar.get()._id;
        if (!projectId) {
            VZ.notify('Please select project first');
            return;
        }
        let newTaskFiles = template.newTaskFiles.get();
        const newTaskFilesVar = template.newTaskFiles;
        const modalData = {
            projectId,
            taskId: 'new-task',
            newTaskFilesVar,
            onAddFilesCb(file) {
                newTaskFiles.push(file);
                template.newTaskFiles.set(newTaskFiles);
            }
        };
        Blaze.renderWithData(Template.taskAttachmentsModal, modalData, document.body);
    },
    'click #save': _.debounce(function (event, template) {
        event.preventDefault();
        event.stopPropagation();
        const data = {
            name: document.getElementById('titleTaskModal').value.trim(),
            description: document.getElementById('descriptionCentreModal').value.trim(),
            projectId: template.projectVar.get()._id,
            membersIds: template.newTaskUserIds.get(),
            taskFiles: template.newTaskFiles.get()
        };

        createTask.call({ task: data }, (err, res) => {
            if (err) {
                console.error(err);
                VZ.notify(err.reason || err.message);
            } else {
                VZ.notify('Task successfully created!');
                $('.modal').modal('close');
                Blaze.remove(template.view);
            }
        });

    }, 1000)
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};