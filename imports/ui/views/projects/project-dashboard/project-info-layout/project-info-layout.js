import {VZ} from '/imports/startup/both/namespace';
import './project-info-layout.html';

Template.projectInfoLayout.onCreated(function () {
  this.autorun(() => {
    Template.currentData();
  });
});

Template.projectInfoLayout.onRendered(function () {
});

Template.projectInfoLayout.helpers({
  timeTracked() {
    return this.project.trackingInfo ? parseInt(this.project.trackingInfo.allUsers.allTime.tracked / 1000) : 0;
  },
  moneyEarned(){
    return this.project.trackingInfo ? this.project.trackingInfo.allUsers.allTime.earned.toFixed(2) : 0;
  },
  assignedUsersCount() {
    return this.project.assignedUsersIds && this.project.assignedUsersIds.length || 0;
  },
  tasksCompleted(){
    return this.project && this.project.info && this.project.info.tasksCompleted || 0;
  },
  tasksCount(){
    return this.project && this.project.info && this.project.info.tasksCount || 0;
  },
  canEditProject() {
    let projectId = this.project && this.project._id;
    return VZ.canUser('editProject', Meteor.userId(), projectId);
  }
});

Template.projectInfoLayout.events({});
