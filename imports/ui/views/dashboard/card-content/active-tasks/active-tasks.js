import {TimeEntries} from '/imports/api/timeEntries/timeEntries';
import {Tasks} from '/imports/api/tasks/tasks';
import './active-tasks.html';
import './dashboard-card-active';
import './users-active-tasks-list';

Template.usersActiveTasks.onCreated(function () {
  this.isReady = new ReactiveVar(false);

  this.autorun(() => {
    let data = Template.currentData();
    if (data && data.usersLastEntries && data.usersCurrentEntries) {
      let ids = _.uniq(_.union(data.usersLastEntries, data.usersCurrentEntries));
      let sub = this.subscribe('entriesByIds', ids);
      if (sub.ready()) {
        this.isReady.set(true);
      }
    }
  });
});

Template.usersActiveTasks.onRendered(function () {

});

Template.usersActiveTasks.helpers({
  taskItems() {
    let data = Template.instance().data;
    if (data && data.usersLastEntries && data.usersCurrentEntries) {
      let ids = _.uniq(_.union(data.usersLastEntries, data.usersCurrentEntries));
      let timeEntries = TimeEntries.find({_id: {$in: ids}}).fetch();
      let tasksIds = _.uniq(_.map(timeEntries, function (entry) {
        return entry.taskId;
      }));
      let tasks = _.clone(Tasks.find({_id: {$in: tasksIds}}).fetch());
      let allTasks = [];
      tasks.forEach((task) => {
        timeEntries.forEach((entry) => {
          if (task._id === entry.taskId && _.contains(task.membersIds, entry.userId)) {
            let user = Meteor.users.findOne({_id: entry.userId});
            if (user.profile.entryId === entry._id) {
              let activeTask = _.clone(task);
              activeTask.trakingUserId = user._id;
              activeTask.taskTimeTrackedActive = parseInt(activeTask.trackingInfo.allUsers.allTime.tracked / 1000);
              activeTask.totalSpentActive = activeTask.trackingInfo.allUsers.allTime.earned.toFixed(2);
              allTasks.push(activeTask);
            }
           else if (user.profile.lastWorkedEntryId === entry._id) {
              let lastWorkedTask = _.clone(task);
              lastWorkedTask.lastWorked = true;
              lastWorkedTask.endDate = entry.endDate;
              lastWorkedTask.workerId = entry.userId;
              lastWorkedTask.taskTimeTrackedActive = parseInt(lastWorkedTask.trackingInfo.allUsers.allTime.tracked / 1000);
              lastWorkedTask.totalSpentActive = lastWorkedTask.trackingInfo.allUsers.allTime.earned.toFixed(2);
              allTasks.push(lastWorkedTask);
            }
          }
        });
      });
      return allTasks;
    }
  },
  emptyCardMessage() {
    return 'You have no worked on tasks';
  },
  dataLoadingMessage() {
    return 'Loading...';
  },
  isSubscriptionReady() {
    return Template.instance().isReady.get();
  }
});

Template.usersActiveTasks.events({});