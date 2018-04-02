import './projects-list';

Template.dashboardProject.helpers({
  lastUpdate(){
    return moment(this.updatedAt).calendar();
  },
  assignedUsersCount() {
    return this.assignedUsersIds && this.assignedUsersIds.length || 0;
  },
  tasksCompleted(){
      const tasks = this.tasksInfo.individual.find(track => track.userId === Meteor.userId());
      if (tasks) {
          return tasks.completed;
      } else {
          return this.tasksInfo.allUsers.completed;
      }
  },
  tasksCount(){
      const tasks = this.tasksInfo.individual.find(track => track.userId === Meteor.userId());
      if (tasks) {
          return tasks.all;
      } else {
          return this.tasksInfo.allUsers.all;
      }
  },
  timeTracked(){
    return this.trackingInfo ? parseInt(this.trackingInfo.allUsers.allTime.tracked / 1000) : 0;
  },
  totalSpendings(){
    return this.trackingInfo ? this.trackingInfo.allUsers.allTime.earned.toFixed(2) : 0;
  }
});