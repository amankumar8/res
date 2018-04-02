import './activity-item.html';

Template.dashboardWorkerActivityItem.helpers({
  totalTime() {
    const weekTimeCount = this.weekTimeCount;
    let result = 0;
    for(let x = 0, count = weekTimeCount.length; x < count; x++) {
      result += weekTimeCount[x].timeCount;
    }
    return result / 1000;
  },
  totalMoneyEarned() {
    return this.totalEarned && this.totalEarned.toFixed(2) || 0;
  }
});
