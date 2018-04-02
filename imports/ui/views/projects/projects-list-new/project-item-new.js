/**
 * Created by yukinohito on 3/25/17.
 */
import { Template } from 'meteor/templating';
import { Router } from 'meteor/iron:router';

import './project-item-new.html';
import {Projects} from "../../../../api/projects/projects";

Template.projectListItem.onCreated(function() {
});

Template.projectListItem.helpers({
  workersCount() {
    let assignedUsersIds = this.assignedUsersIds ? this.assignedUsersIds.length : 0;
    if(assignedUsersIds === 1) {
      return `${assignedUsersIds} worker`;
    } else {
      return `${assignedUsersIds} workers`;
    }
  },
  getLastUpdatedAt() {
    const oneMinute = 1000 * 60;
    const lastUpdatedAt = moment(this.updatedAt);
    let fromNow = lastUpdatedAt.fromNow();
    if(moment().diff(lastUpdatedAt) < oneMinute) {
      fromNow = 'moments ago';
    }
    return `${fromNow} ${lastUpdatedAt.format('HH:mm')}`;
  },
  getTimeTracked() {
    return this.trackingInfo ? parseInt(this.trackingInfo.allUsers.allTime.tracked / 1000) : 0;
  },
  getMoneyEarned() {
    return this.trackingInfo ? this.trackingInfo.allUsers.allTime.earned.toFixed(2) : '0';
  },
  getTasksDone() {
    const data = Template.instance().data;
    if(data.tasksInfo){
      const tasks = data.tasksInfo.individual.find(track => track.userId === Meteor.userId());
      if (tasks) {
        const tasksAllCount = tasks.all;
        const tasksDoneCount = tasks.completed;
        return `${tasksDoneCount} / ${tasksAllCount}`;
      } else {
        const tasksAllCount = data.tasksInfo.allUsers.all;
        const tasksDoneCount = data.tasksInfo.allUsers.completed;
        return `${tasksDoneCount} / ${tasksAllCount}`;
      }
    }
    else {
      return '0 / 0';
    }
  }
});

Template.projectListItem.events({
  'click .title-info>h5': function(event, template) {
    Router.go(`/project/${template.data._id}/dashboard/tasks`);
  }
});
