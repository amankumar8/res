import { Tasks } from '/imports/api/tasks/tasks';
import './tasks-list.html';
import './task-item';
import './completed-tasks/completed-tasks';

Template.dashboardTasksList.onCreated(function () {
    this.isReady = new ReactiveVar(false);
    this.autorun(() => {
        let sub = this.subscribe('dashboardAssignedTasks');
        if(sub.ready()){
            this.isReady.set(true);
        }
    });
  this.setTaskTimeAndMoney = (tasks) => {
    _.each(tasks, function (task) {
      task.taskTimeTracked = parseInt(task.trackingInfo.allUsers.allTime.tracked / 1000);
      task.totalSpent = task.trackingInfo.allUsers.allTime.earned.toFixed(2);
    });
    return tasks;
  }
});

Template.dashboardTasksList.onRendered(function () {
});

Template.dashboardTasksList.helpers({
    taskItems() {
        let tmpl = Template.instance();
        let ready = tmpl.isReady.get();
        if(ready){
          let tasks = Tasks.find({membersIds: Meteor.userId(), archived: false}).fetch();
            tasks = tmpl.setTaskTimeAndMoney(tasks);
            return tasks;
        }
        else {
            return [];
        }
    },
    emptyCardMessage() {
        return 'You have no assigned tasks';
    },
    dataLoadingMessage() {
        return 'Loading...';
    },
  isSubscriptionReady() {
        return Template.instance().isReady.get();
    }
});

Template.dashboardTasksList.events({
});