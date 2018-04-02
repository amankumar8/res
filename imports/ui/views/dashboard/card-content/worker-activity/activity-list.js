import {VZ} from '/imports/startup/both/namespace';
import {TimeEntries} from '/imports/api/timeEntries/timeEntries';
import {Contracts} from '/imports/api/contracts/contracts';

import './activity-list.html';

Template.dashboardWorkerActivityList.onCreated(function () {
  this.isReady = new ReactiveVar(false);
  const dateRange = {
    date: moment().toDate(),
    range: 'Weekly'
  };

  this.autorun(() => {
    let user = Meteor.user();
    let companyId = user.profile && user.profile.selectedCompanyId;
    let sub = this.subscribe('dashboardWorkerActivityCard', dateRange, companyId);
    if (sub.ready()) {
      this.isReady.set(true);
    }
  });

  this.prepareWeekTimeArray = function (startOfThisWeek) {
    const copyStartOfThisWeek = startOfThisWeek.clone();
    const dateFormat = "YYYY-MM-DD";
    let result = [];
    result[0] = {
      date: copyStartOfThisWeek.format(dateFormat),
      timeCount: 0
    };
    for (let x = 1, count = 7; x < count; x++) {
      result[x] = {
        date: copyStartOfThisWeek.add(1, "day").format(dateFormat),
        timeCount: 0
      }
    }
    return result;
  }
});
Template.dashboardWorkerActivityList.helpers({
  /**
   * This function makes following calculations:
   * 1. Get contracts and timeEntries of other users,
   * timeEntries taken for current week only
   * 2. Calculate amount of time each user tracked
   * doing tasks in contracted projects each day of week
   * 3. Calculate total week time count for each user
   * and total earned amount of money from all contracts
   *
   * Result array elements have followring structure: {
    *     workerId,
    *     weekTimeCount: [],
    *     totalEarned: 25
    * },
   * where weekTimeCount[n] = {
    *     date: "YYYY-MM-DD",
    *     timeCount: 1342798
    * }, timeCount in milliseconds
   * Be advised that totalEarned counts with different rates
   * from different contracts.
   **/
  workersItems() {
    let workers = [];
    const dateFormat = "YYYY-MM-DD";
    const oneHour = 1000 * 60 * 60;
    const contracts = Contracts.find({
      workerId: {
        $ne: Meteor.userId()
      },
      employerId: Meteor.userId()
    }).fetch();
    const startOfThisWeek = moment().startOf(VZ.dateRanges['Weekly']);
    const endOfThisWeek = moment().endOf(VZ.dateRanges['Weekly']);

    const timeEntries = TimeEntries.find({
      userId: {
        $ne: Meteor.userId()
      },
      startDate: {
        $gte: startOfThisWeek.toDate(),
        $lte: endOfThisWeek.toDate()
      },
      _done: true,
      _isActive: false
    }, {
      $sort: {
        startDate: -1
      }
    }).fetch();

    // prepare variables for data
    let contractedUsersIds = [];
    contracts.forEach(contract => {
      let wIndex = contractedUsersIds.findIndex(item => item.workerId === contract.workerId);
      if (wIndex === -1) {
        wIndex = contractedUsersIds.length;
        contractedUsersIds.push({
          workerId: contract.workerId,
          contracts: []
        });
        workers.push({
          workerId: contract.workerId,
          weekTimeCount: Template.instance().prepareWeekTimeArray(startOfThisWeek),
          totalEarned: 0
        });
      }
      const enhancedContract = Object.assign({}, contract, {
        contractedTime: 0
      });
      contractedUsersIds[wIndex].contracts.push(enhancedContract);
    });

    // count time for each user each contract each day of the week
    timeEntries.forEach(timeEntry => {
      for (let x = 0, count = contractedUsersIds.length; x < count; x++) {
        const userId = contractedUsersIds[x].workerId;
        const contracts = contractedUsersIds[x].contracts;
        contracts.forEach(contract => {
          //console.log("time entry and contract", userId, contract.contractedTime, contract, timeEntry);
          if (timeEntry.contractId === contract._id && userId === timeEntry.userId) {
            const duration = timeEntry.endDate - timeEntry.startDate;
            contract.contractedTime += duration;
            const wIndex = workers.findIndex(worker => worker.workerId === userId);
            const formattedStartDate = moment(timeEntry.startDate).format(dateFormat);
            const dIndex = workers[wIndex].weekTimeCount.findIndex(item => item.date === formattedStartDate);
            workers[wIndex].weekTimeCount[dIndex].timeCount += duration;
          }
        });
      }
    });

    // count money earned for each user in every contract
    contractedUsersIds.forEach(userData => {
      //console.log("wIndex", workers, userData.workerId, workerIndex(workers, userData.workerId));
      const wIndex = workers.findIndex(worker => worker.workerId === userData.workerId);
      userData.contracts.forEach(contract => {
        if (contract.paymentInfo && contract.paymentInfo.type === 'hourly') {
          //console.log("count money", contract.contractedTime);
          workers[wIndex].totalEarned += contract.contractedTime * contract.paymentInfo.rate / oneHour;
        }
      });
    });

    return workers;
  },
  emptyCardMessage () {
    return 'Nothing to show in activity';
  },
  dataLoadingMessage() {
    return 'Loading...';
  },
  isSubscriptionReady() {
    return Template.instance().isReady.get();
  }
});
