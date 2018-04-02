import { Template } from 'meteor/templating';
import { ContractsStatusChanges } from '/imports/api/contractsStatusChanges/contractsStatusChanges';
import './contractEditHistoryTab.html';

Template.contractEditHistoryTab.onCreated(function () {
  this.autorun(() => {
    this.subscribe('viewContract', this.data.contractId);
  });
});

Template.contractEditHistoryTab.helpers({
  statuses () {
    const contractId = Template.instance().data.contractId;
    const result = ContractsStatusChanges.find({
      contractId
    }, {
      sort: {
        changedAt: 1
      }
    }).fetch().map(function (status, index, array) {
      const statusObj = {
        name: status.status,
        startDate: moment(status.changedAt).format('MMMM DD, YYYY')
      };

      statusObj.endDate = index < array.length - 1 ?
        moment(array[ index + 1 ].changedAt).format('MMMM DD, YYYY') : 'Today';

      return statusObj;
    });
    return result;
  },
  areStatusesPresent() {
    const contractId = Template.instance().data.contractId;
    return ContractsStatusChanges.find({
      contractId
    }, {
      sort: {
        changedAt: 1
      }
    }).count() > 0;
  }
});
