import {Tasks} from '/imports/api/tasks/tasks';
import {Contracts} from '/imports/api/contracts/contracts';
import './spendings-earnings-list.html';
import './total-time-money-list';

Template.spendingsEarningsList.onCreated(function () {
  this.isReady = new ReactiveVar(false);

  this.autorun(() => {
    let data = Template.currentData();
    if (data && data.title) {
      if (data.title === 'Spendings') {
        let spendingsCardData = this.subscribe('spendingsCardData');
        if (spendingsCardData.ready()) {
          this.isReady.set(true);
        }
      }
      else if (data.title === 'Earnings') {
        let userContracts = this.subscribe('userContracts');
        let earningsCardData = this.subscribe('earningsCardData');
        if (userContracts.ready() && earningsCardData.ready()) {
          this.isReady.set(true);
        }
      }
    }
  });

  this.getIndividualTrackedTime = (tasks, period) => {
    const trakedTime = tasks.reduce((sum, task) => {
      if (task.trackingInfo) {
        if (task.trackingInfo.individual.length > 0) {
          const track = task.trackingInfo.individual.find(track => track.userId === Meteor.userId());
          return track ? sum += track[period].tracked : sum;
        } else {
          return sum;
        }
      } else {
        return sum;
      }
    }, 0);

    const moneyEarned = tasks.reduce((sum, task) => {
      if (task.trackingInfo) {
        if (task.trackingInfo.individual.length > 0) {
          const track = task.trackingInfo.individual.find(track => track.userId === Meteor.userId());
          return track ? sum += track[period].earned : sum;
        } else {
          return sum;
        }
      } else {
        return sum;
      }
    }, 0);
    return {
      timeTracked: parseInt(trakedTime / 1000),
      totalSpent: moneyEarned.toFixed(2)
    };
  };

  this.getTrackedTimeForTask = (tasks, period) => {
    let tasksWithCounts = [];

    tasks.forEach(function (task) {
      if (task.trackingInfo) {
        if (task.trackingInfo.individual.length > 0) {
          const track = task.trackingInfo.individual.find(track => track.userId === Meteor.userId());
          if (track) {
            const timeTracked = parseInt(track[period].tracked / 1000) || 0;
            if (timeTracked > 0) {
              tasksWithCounts.push({
                taskCounts: {
                  timeTracked: timeTracked,
                  totalSpent: track[period].earned.toFixed(2) || 0
                }, taskId: task._id
              });
            }
          }
        }
      }
    });

    return tasksWithCounts;
  };
  this.getTimeMoneySpend = (tasks, period) => {
    const trakedTime = tasks.reduce((sum, task) => {
      if (task) {
        if (task[period]) {
          const track = task[period];
          return track ? sum += track.tracked : sum;
        } else {
          return sum;
        }
      } else {
        return sum;
      }
    }, 0);

    const moneyEarned = tasks.reduce((sum, task) => {
      if (task) {
        if (task[period]) {
          const track = task[period];

          return track ? sum += track.earned : sum;
        } else {
          return sum;
        }
      } else {
        return sum;
      }
    }, 0);
    return {
      timeTracked: parseInt(trakedTime / 1000),
      totalSpent: moneyEarned.toFixed(2)
    };
  };
  this.getTasksAllTrackedTime = (tasks, period) => {
    const trakedTime = tasks.reduce((sum, task) => {
      if (task.trackingInfo) {
        if (_.keys(task.trackingInfo.allUsers).length > 0) {
          const track = task.trackingInfo.allUsers;
          return track ? sum += track[period].tracked : sum;
        } else {
          return sum;
        }
      } else {
        return sum;
      }
    }, 0);

    const moneyEarned = tasks.reduce((sum, task) => {
      if (task.trackingInfo) {
        if (_.keys(task.trackingInfo.allUsers).length > 0) {
          const track = task.trackingInfo.allUsers;
          return track ? sum += track[period].earned : sum;
        } else {
          return sum;
        }
      } else {
        return sum;
      }
    }, 0);

    return {
      timeTracked: parseInt(trakedTime / 1000),
      totalSpent: moneyEarned.toFixed(2)
    };
  };
  this.removeTaskTrackedDuplicates = (usersWithCounts) => {
    let usersbyIds = _.groupBy(usersWithCounts, function (user) {
      return user.userId;
    });
    for (let userId in usersbyIds) {
      if (usersbyIds[userId].length > 1) {
        let userTaskCounts = [];
        let userData = usersbyIds[userId];

        const trakedTime = userData.reduce((sum, user) => {
          return sum += user.userCounts.timeTracked;
        }, 0);

        const earnedMoney = userData.reduce((sum, user) => {
          return sum += parseFloat(user.userCounts.totalSpent);
        }, 0);
        userData.forEach((user) => {
          user.userTaskCounts.forEach((taskCount) => {
            userTaskCounts.push(taskCount);
          });
        });
        let newUserData = {
          userCounts: {
            timeTracked: trakedTime,
            totalSpent: earnedMoney.toFixed(2)
          },
          userId: userId,
          userTaskCounts: userTaskCounts
        };

        usersWithCounts = _.reject(usersWithCounts, function (user) {
          return user.userId === userId;
        });
        usersWithCounts.push(newUserData);
      }
    }
    return usersWithCounts;
  };

  this.getTrackedTimeForUser = (tasks, period) => {
    let usersWithCounts = [];

    tasks.forEach((task) => {
      if (task.trackingInfo) {
        if (task.trackingInfo.individual.length > 0) {
          let taskTracks = task.trackingInfo.individual;
          taskTracks = _.map(taskTracks, function (taskTrack) {
            taskTrack.taskId = task._id;
            return taskTrack;
          });

          let users = _.groupBy(taskTracks, function (taskTrack) {
            return taskTrack.userId;
          });
          for (let userId in users) {
            let tasksWithCounts = [];
            if (users[userId].length == 0) {
              delete users[userId];
            }
            let tasks = _.groupBy(users[userId], function (entry) {
              return entry.taskId;
            });
            for (let taskId in tasks) {

              if (tasks[taskId].length == 0) {
                delete tasks[taskId];
              }

              let taskCounts = this.getTimeMoneySpend(tasks[taskId], period);
              if (taskCounts.totalSpent > 0) {
                tasksWithCounts.push({taskId: taskId, taskCounts: taskCounts});
              }
            }
            let userCounts = this.getTimeMoneySpend(users[userId], period);
            if (userCounts.totalSpent > 0) {
              usersWithCounts.push({userId: userId, userCounts: userCounts, userTaskCounts: tasksWithCounts});
            }
          }
        }
      }
    });
    usersWithCounts = this.removeTaskTrackedDuplicates(usersWithCounts);
    return usersWithCounts;
  };

  this.areContractsPresent = (userContracts) => {
    return userContracts && userContracts.length > 0;
  }
});

Template.spendingsEarningsList.onRendered(function () {
  this.autorun(() => {
    if (this.isReady.get()) {
      Meteor.defer(function () {
        $('.collapsible').collapsible();
      });
    }
  });
});

Template.spendingsEarningsList.helpers({
  totalCounts() {
    let tmpl = Template.instance();
    let ready = tmpl.isReady.get();
    if (ready) {
      let title = tmpl.data && tmpl.data.title;
      let userContracts;
      let contractedUsers;

      let todayCounts, todayTasksWithCounts, todayUsersWithCounts;
      let yesterdayCounts, yesterdayTasksWithCounts, yesterdayUsersWithCounts;
      let thisWeekCounts, thisWeekTasksWithCounts, thisWeekUsersWithCounts;
      let lastWeekCounts, lastWeekTasksWithCounts, lastWeekUsersWithCounts;
      let monthCounts, monthTasksWithCounts, thisMonthWeekUsersWithCounts;
      let lastMonthCounts, lastMonthTasksWithCounts, lastMonthWeekUsersWithCounts;

      let or = [
        {'trackingInfo.allUsers.today.tracked': {$gt: 0}},
        {'trackingInfo.allUsers.yesterday.tracked': {$gt: 0}},
        {'trackingInfo.allUsers.thisWeek.tracked': {$gt: 0}},
        {'trackingInfo.allUsers.lastWeek.tracked': {$gt: 0}},
        {'trackingInfo.allUsers.thisMonth.tracked': {$gt: 0}},
        {'trackingInfo.allUsers.lastMonth.tracked': {$gt: 0}}
      ];

      if (title === 'Spendings') {
        userContracts = Contracts.find({employerId: Meteor.userId()}).fetch();
        contractedUsers = _.map(userContracts, function (contract) {
          return contract.workerId;
        });
        contractedUsers = _.uniq(contractedUsers);
        let query = {$and: [{membersIds: {$in: contractedUsers}}, {trackingInfo: {$exists: true}}]};

        const tasks = Tasks.find(query).fetch();
        todayCounts = tmpl.getTasksAllTrackedTime(tasks, 'today');
        yesterdayCounts = tmpl.getTasksAllTrackedTime(tasks, 'yesterday');
        thisWeekCounts = tmpl.getTasksAllTrackedTime(tasks, 'thisWeek');
        lastWeekCounts = tmpl.getTasksAllTrackedTime(tasks, 'lastWeek');
        monthCounts = tmpl.getTasksAllTrackedTime(tasks, 'thisMonth');
        lastMonthCounts = tmpl.getTasksAllTrackedTime(tasks, 'lastMonth');

        todayUsersWithCounts = tmpl.getTrackedTimeForUser(tasks, 'today');
        yesterdayUsersWithCounts = tmpl.getTrackedTimeForUser(tasks, 'yesterday');
        thisWeekUsersWithCounts = tmpl.getTrackedTimeForUser(tasks, 'thisWeek');
        lastWeekUsersWithCounts = tmpl.getTrackedTimeForUser(tasks, 'lastWeek');
        thisMonthWeekUsersWithCounts = tmpl.getTrackedTimeForUser(tasks, 'thisMonth');
        lastMonthWeekUsersWithCounts = tmpl.getTrackedTimeForUser(tasks, 'lastMonth');

      }
      else if (title === 'Earnings') {
        let query = {
          membersIds: Meteor.userId(),
          trackingInfo: {$exists: true}
        };
        query.$or = or;
        userContracts = Contracts.find({workerId: Meteor.userId()}).fetch();
        const tasks = Tasks.find(query).fetch();

        todayCounts = tmpl.getIndividualTrackedTime(tasks, 'today');
        yesterdayCounts = tmpl.getIndividualTrackedTime(tasks, 'yesterday');
        thisWeekCounts = tmpl.getIndividualTrackedTime(tasks, 'thisWeek');
        lastWeekCounts = tmpl.getIndividualTrackedTime(tasks, 'lastWeek');
        monthCounts = tmpl.getIndividualTrackedTime(tasks, 'thisMonth');
        lastMonthCounts = tmpl.getIndividualTrackedTime(tasks, 'lastMonth');

        todayTasksWithCounts = tmpl.getTrackedTimeForTask(tasks, 'today');
        yesterdayTasksWithCounts = tmpl.getTrackedTimeForTask(tasks, 'yesterday');
        thisWeekTasksWithCounts = tmpl.getTrackedTimeForTask(tasks, 'thisWeek');
        lastWeekTasksWithCounts = tmpl.getTrackedTimeForTask(tasks, 'lastWeek');
        monthTasksWithCounts = tmpl.getTrackedTimeForTask(tasks, 'thisMonth');
        lastMonthTasksWithCounts = tmpl.getTrackedTimeForTask(tasks, 'lastMonth');

      }

      if (tmpl.areContractsPresent(userContracts)) {

        let result = [
          {
            name: 'Today',
            counts: todayCounts,
            items: title == 'Spendings' ? todayUsersWithCounts : todayTasksWithCounts
          },
          {
            name: 'Yesterday',
            counts: yesterdayCounts,
            items: title == 'Spendings' ? yesterdayUsersWithCounts : yesterdayTasksWithCounts
          },
          {
            name: 'This week',
            counts: thisWeekCounts,
            items: title == 'Spendings' ? thisWeekUsersWithCounts : thisWeekTasksWithCounts
          },
          {
            name: 'Last week',
            counts: lastWeekCounts,
            items: title == 'Spendings' ? lastWeekUsersWithCounts : lastWeekTasksWithCounts
          },
          {
            name: 'This month',
            counts: monthCounts,
            items: title == 'Spendings' ? thisMonthWeekUsersWithCounts : monthTasksWithCounts
          },
          {
            name: 'Last month',
            counts: lastMonthCounts,
            items: title == 'Spendings' ? lastMonthWeekUsersWithCounts : lastMonthTasksWithCounts
          }
        ];
        return result;
      }
      else {
        let noContractResult = {timeTracked: 0, totalSpent: '0.00'};
        return [
          {name: 'Today', counts: noContractResult, items: []},
          {name: 'Yesterday', counts: noContractResult, items: []},
          {name: 'This week', counts: noContractResult, items: []},
          {name: 'Last week', counts: noContractResult, items: []},
          {name: 'This month', counts: noContractResult, items: []},
          {name: 'Last month', counts: noContractResult, items: []}
        ];
      }
    }
    else {
      return [];
    }
  },
  emptyCardMessage() {
    return 'No data to show';
  },
  dataLoadingMessage() {
    return 'Loading...';
  },
  isSubscriptionReady() {
    return Template.instance().isReady.get();
  }
});

Template.spendingsEarningsList.events({});
