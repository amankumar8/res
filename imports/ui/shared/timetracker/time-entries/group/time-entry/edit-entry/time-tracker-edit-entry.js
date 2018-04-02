import './time-tracker-edit-entry.html';

import { VZ } from '/imports/startup/both/namespace';
import { Projects } from '/imports/api/projects/projects';
import { editTimeEntry } from '/imports/api/timeEntries/methods';

Template.editTimeEntry.onCreated(function () {
    let project = Template.currentData().entry.projectId;
    this.currentProject = new ReactiveVar(project);
    this.startTime = new ReactiveVar(this.data.entry.startDate);
    this.endTime = new ReactiveVar(this.data.entry.endDate);
    this.isTagPopupActive = new ReactiveVar(false);
    this.data.tagArray = new ReactiveArray();
    
    if(this.data.entry.tags){
        this.data.tagArray = new ReactiveArray(this.data.entry.tags);
    } 
});

Template.editTimeEntry.onRendered(function () {
    let start = moment(this.startTime.get()).format('DD/MM/YYYY HH:mm:ss');
    let end = moment(this.endTime.get()).format('DD/MM/YYYY HH:mm:ss');
    this.$('#editStartTime').val(start);
    this.$('#editEndTime').val(end);
});

Template.editTimeEntry.helpers({
    duration() {
        let tmpl = Template.instance();
        let duration = moment(tmpl.endTime.get()).diff(tmpl.startTime.get()), //milliseconds
            hours = parseInt(moment.duration(duration).asHours());
        if (hours < 10) {
            hours = '0' + hours;
        }
        return hours + moment.utc(duration).format(':mm:ss')
    },

    project() {
        let project = Projects.findOne(Template.instance().currentProject.get());
        if (project && project.name)
            return project.name;
        else
            return 'No project';
    },

    hasProject() {
        return !!Template.instance().currentProject.get();
    },
    
    isTagPopupActive() {
        return Template.instance().isTagPopupActive.get();
    },
    
    tagPopupControls() {
        return {
            tagArray: this.tagArray,
            isTagPopupActive: Template.instance().isTagPopupActive
        }
    }

});

Template.editTimeEntry.events({
    'click .select-project': function (e, tmpl) {
        let parentNode = $('body')[0],
            onProjectSelected = function (projectId) {
                console.log('selected projectId:', projectId);
                tmpl.currentProject.set(projectId);
            },
            modalData = {
                onProjectSelected: onProjectSelected
            };

        Blaze.renderWithData(Template.timeTrackerProjectModalPicker, modalData, parentNode);
    },

    'click .cancel-entry-editing': function (e, tmpl) {
        tmpl.data.stateCb(false);
    },

    'click .submit-entry-editing': function (e, tmpl) {
        let changeObj = {},
            newEntryName = tmpl.$('.entry-name-input').val(),
            newProject = tmpl.currentProject.get();

        if (newEntryName.length < 5) {
            VZ.notify('The message is too short.', 3000);
            return;
        }

        if (newEntryName.length > 50) {
            VZ.notify('Not allowed more than 50 characters');
            return;
        }

        if (newEntryName != tmpl.data.entry.message) {
            changeObj.message = newEntryName;
        }
        if (newProject != tmpl.data.entry.projectId) {
            changeObj.projectId = newProject;
        }

        if (tmpl.startTime.get() && tmpl.endTime.get()) {
            changeObj.startDate = moment(tmpl.startTime.get()).toDate();
            changeObj.endDate = moment(tmpl.endTime.get()).toDate();
            changeObj._totalMinutes = moment(changeObj.endDate).diff(changeObj.startDate, 'minutes');
        }

        if (!_.isEmpty(changeObj)) {
            changeObj._id = tmpl.data.entry._id;
            changeObj.tags = tmpl.data.tagArray.array();
            editTimeEntry.call(changeObj, function (err, res) {
                if (err) {
                    console.log(err);
                    VZ.notify('Failed to update time entry');
                }
                else {
                    VZ.notify('Entry updated');
                    tmpl.data.stateCb();
                }
            })
        }
        else {
            tmpl.data.stateCb();
        }
    },

    'click .remove-project': function (e, tmpl) {
        e.preventDefault();
        e.stopPropagation();
        tmpl.currentProject.set('');
    },

    'input .edit-time-input': function (e, tmpl) {
        let start = moment(tmpl.$('#editStartTime').val(), 'DD/MM/YYYY HH:mm:ss');
        let end = moment(tmpl.$('#editEndTime').val(), 'DD/MM/YYYY HH:mm:ss');

        if (start.isValid() && end.isValid()) {
            tmpl.startTime.set(start);
            tmpl.endTime.set(end);
        } else {
            tmpl.startTime.set();
            tmpl.endTime.set();
        }

    },
    
    'click .tag-icon': function (e, tmpl) {
        tmpl.isTagPopupActive.set(!tmpl.isTagPopupActive.get());
    }
});