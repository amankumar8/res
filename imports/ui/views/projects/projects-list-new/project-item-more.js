import { VZ } from '/imports/startup/both/namespace';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Router } from 'meteor/iron:router';
import { archiveProject, restoreProject } from '/imports/api/projects/methods';

import './project-item-more.html';

Template.projectListItemMore.onCreated(function() {
  this.isBoss = VZ.canUser('viewTimeEntriesRelatedToProject', Meteor.userId(), this.data.project._id);
  this.currentMode = new ReactiveVar(this.isBoss === true ? 'Cost' : 'Hours');
  this.checkProjectInfo = () => {
    const info = this.data.project.info;
    return info !== undefined &&
           info.tasksCount !== undefined &&
           info.tasksCompleted !== undefined &&
           info.totalContractedTime !== undefined &&
           info.totalEarned !== undefined &&
           info.totalTrackedTime !== undefined;
  };
  this.contracted = function(timeEntries) {
    return timeEntries.filter(timeEntry => {
      return typeof timeEntry.contractId === 'string' && timeEntry.contractId.length > 0;
    });
  };
  function addZero(number) {
    if(number < 10) {
      return '0' + number;
    } else {
      return number;
    }
  }
  const oneSecond = 1000;
  const oneMinute = oneSecond * 60;
  const oneHour = oneMinute * 60;
  this.formatTime = function(time) {
    const hours = Math.floor(time / oneHour);
    const minutes = Math.floor((time - hours * oneHour) / oneMinute);
    const seconds = Math.floor((time - hours * oneHour - minutes * oneMinute) / oneSecond);
    return `${addZero(hours)}:${addZero(minutes)}:${addZero(seconds)}`;
  };
  this.tracked = function(timeEntries, isNumber) {
    const timeTracked = timeEntries.reduce((sum, timeEntry) => {
      return sum += timeEntry.endDate - timeEntry.startDate;
    }, 0);
    if(isNumber === 'number') {
      return timeTracked;
    }
    return this.formatTime(timeTracked);
  };
  this.earned = function(timeEntries, rate) {
    return rate * timeEntries.reduce((sum, timeEntry) => {
        return sum += timeEntry.endDate - timeEntry.startDate;
      }, 0) / oneHour;
  };
});

Template.projectListItemMore.helpers({
  userIsBoss() {
    return Template.instance().isBoss;
  },
  getCurrentMode() {
    return Template.instance().currentMode.get();
  },
  resultThisWeek() {
    const template = Template.instance();
    const mode = template.currentMode.get();
    const project = template.data.project;
      let result;
      if(mode === 'Cost') {
        result = project.trackingInfo ? `$ ${project.trackingInfo.allUsers.thisWeek.earned.toFixed(2)}` : 0;
      } else if(mode === 'Hours') {
        result = project.trackingInfo ? `$ ${template.formatTime(parseInt(project.trackingInfo.allUsers.thisWeek.tracked))}` : 0;
      } else {
        throw new Meteor.Error(`Unknown mode ${mode}`);
      }
      return result;
  },
  modeVerb() {
    const mode = Template.instance().currentMode.get();
    if(mode === 'Cost') {
      return 'spent';
    } else if(mode === 'Hours') {
      return 'tracked';
    } else {
      throw new Meteor.Error(`Unknown mode ${mode}`);
    }
  },
  compareToLastWeek() {
    const template = Template.instance();
    const mode = template.currentMode.get();
    const project = template.data.project;
    if(project.trackingInfo) {
      let resultLastWeek, resultThisWeek;
      if(mode === 'Cost') {
        resultLastWeek = project.trackingInfo.allUsers.lastWeek.earned || 0;
        resultThisWeek = project.trackingInfo.allUsers.thisWeek.earned || 0;
      } else if(mode === 'Hours') {
        resultLastWeek = parseInt(project.trackingInfo.allUsers.lastWeek.tracked / 1000) || 0;
        resultThisWeek = parseInt(project.trackingInfo.allUsers.thisWeek.tracked / 1000) || 0;
      } else {
        throw new Meteor.Error(`Unknown mode ${mode}`);
      }
      if(resultLastWeek < resultThisWeek) {
        let diff = resultThisWeek - resultLastWeek;
        return `${parseInt((diff * 100) / resultThisWeek)}% more vs last week`;
      } else if(resultLastWeek > resultThisWeek) {
        let diff = resultLastWeek - resultThisWeek;
        return `${parseInt((diff * 100) / resultLastWeek)}% less vs last week`;
      } else if(resultLastWeek === resultThisWeek) {
        return `Same amount as last week`;
      }
    } else {
      return `Info not available`;
    }
  },
  projectOpenURL() {
    return `/project/${Template.instance().data.project._id}/dashboard/tasks`
  },
  isArchived() {
    return Template.instance().data.project.archived;
  },
  isProjectOwner() {
    const template = Template.instance();
    const project = template.data.project;
    return project.ownerId === Meteor.userId();
  },
  canAssignUsers(){
    const template = Template.instance();
    const project = template.data.project;
    return VZ.canUser('assignUserToProject', Meteor.userId(), project._id);
  }
});

Template.projectListItemMore.events({
  'click .dropdown-content>li': function(event, template) {
    template.currentMode.set(event.target.innerText);
  },
  'click .archive': function(event, template) {
    const project = template.data.project;
    if(project.archived === false) {
        archiveProject.call({projectId:project._id}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                VZ.notify(message);
            } else {
                VZ.notify("Successfully archived!");
            }
        });
    } else {
        restoreProject.call({projectId: project._id}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                VZ.notify(message);
            } else {
                VZ.notify('Restored');
            }
        });
    }
  },
    'click .open-project': function (event, template) {
        const modalData = {
            actionsTemplate: 'projectCreateEditModalActions',
            headTemplate: 'projectCreateEditModalHead',
            headTemplateData: {projectId: template.data.project._id},
            detailsTemplate: 'projectCreateEditModalDetails',
            detailsTemplateData: {projectId: template.data.project._id},
            asideTemplate: 'projectCreateEditModalAside',
            asideTemplateData: {projectId: template.data.project._id}
        };
        let parentNode = $('body')[0];
        Blaze.renderWithData(Template.rightDrawerModal, modalData, parentNode);
        return true;
    }
});
