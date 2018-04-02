import {VZ} from '/imports/startup/both/namespace';
import {TimeEntries} from '/imports/api/timeEntries/timeEntries';
import {Tasks} from '/imports/api/tasks/tasks';
import {Projects} from '/imports/api/projects/projects';
import {changeTaskStatus} from '/imports/api/tasks/methods';

import './in-review-tasks.html';
import './dashboard-in-review-tasks';
import './in-review-task-list';

Template.usersInReviewTasks.onCreated(function () {
  this.isReady = new ReactiveVar(false);

  this.autorun(() => {
    Template.currentData();
    let user = Meteor.user();
    let companyId = user.profile && user.profile.selectedCompanyId;
    let sub = this.subscribe('dashboardInReviewCard', companyId);
    if (sub.ready()) {
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

Template.usersInReviewTasks.onRendered(function () {

});

Template.usersInReviewTasks.helpers({
  taskItems() {
    let tmpl = Template.instance();
    let data = tmpl.data;
    let projects = Projects.find({ownerId: Meteor.userId(), archived: false}).fetch();
    let projectsIds = _.map(projects, function (project) {
      return project._id;
    });
    if (data === 'name') {
      let tasks = Tasks.find({projectId: {$in: projectsIds}, status: 'In-review'}, {$sort: {name: -1}}).fetch();
      tasks = tmpl.setTaskTimeAndMoney(tasks);
      return tasks;
    }
    else if (data === 'time') {
      let tasks = Tasks.find({
        projectId: {$in: projectsIds},
        status: 'In-review'
      }).fetch();

      tasks = tmpl.setTaskTimeAndMoney(tasks);
      tasks = _.sortBy(tasks, 'taskTimeTracked');
      return tasks;
    }
    else if (data === 'earnings') {
      let tasks = Tasks.find({
        projectId: {$in: projectsIds},
        status: 'In-review'
      }).fetch();
      tasks = tmpl.setTaskTimeAndMoney(tasks);

      tasks = _.sortBy(tasks, 'totalSpent');
      return tasks;
    }
    else {
      return [];
    }
  },
  emptyCardMessage() {
    return 'You have no tasks in review';
  },
  dataLoadingMessage() {
    return 'Loading...';
  },
  isSubscriptionReady() {
    return Template.instance().isReady.get();
  }
});

Template.usersInReviewTasks.events({
  'click #approve': function (event, tmpl) {
    event.preventDefault();
    let taskId = this._id;
    changeTaskStatus.call({taskId: taskId, status: 'Closed'}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        VZ.notify(message);
      } else {
        console.log('updated');
      }
    });
  },
  'click #deny': function (event, tmpl) {
    event.preventDefault();
    let taskId = this._id;
    changeTaskStatus.call({taskId: taskId, status: 'Opened'}, (err, res) => {
      if (err) {
        let message = err.reason || err.message;
        VZ.notify(message);
      } else {
        console.log('updated');
      }
    });
  },
  'click #task-name, click #task-key': function (event, tmpl) {
    event.preventDefault();
    let taskId = this._id;
    let projectId = this.projectId;
    Router.go('projectDashboard', {id: projectId, tab: 'tasks'}, {query: {tasks: 'in-review', task: taskId}});
  }
});