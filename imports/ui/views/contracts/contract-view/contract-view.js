import { acceptContract, declineContract, pauseContract, endContract, continueContract } from '/imports/api/contracts/methods';
import { ContractsStatusChanges } from '/imports/api/contractsStatusChanges/contractsStatusChanges';
import { Companies } from '/imports/api/companies/companies';

import './contract-view.html';

Template.contractView.onCreated(function () {

});

Template.contractView.onRendered(function () {

});

Template.contractView.helpers({
    relatedCompanyName() {
        let companyId = this.contract.companyId;
        if (companyId) {
            let company = Companies.findOne(companyId);
            return company ? company.name : 'Something Inc.';
        } else {
            return 'Something Inc.';
        }
    },

    rateType() {
        return 'hour';
    },

    statuses() {
        let contractId = this.contract._id;
        return ContractsStatusChanges.find({contractId: contractId}, {sort: {changedAt: 1}}).fetch().map(function (status, index, array) {
            let statusObj = {
                name: status.status,
                startDate: moment(status.changedAt).format('MMMM DD, YYYY')
            };

            statusObj.endDate = index < array.length - 1 ?
                moment(array[index + 1].changedAt).format('MMMM DD, YYYY') : 'Today';

            return statusObj;
        });
    },

    employerName() {
        let user = Meteor.users.findOne(this.contract.employerId);
        return user ? user.profile.fullName : 'Someone';
    },

    workerName() {
        let user = Meteor.users.findOne(this.contract.workerId);
        return user ? user.profile.fullName : 'Someone';
    },

    shouldShowEmployerInfo() {
        return this.contract.employerId != Meteor.userId();
    },

    shouldShowWorkerInfo() {
        return this.contract.workerId != Meteor.userId();
    },

    canAcceptOrDecline() {
        return this.contract.status == 'pending' && this.contract.workerId == Meteor.userId();
    },
    canPauseOrEnd() {
        return this.contract.status == 'active';// || this.contract.status == 'paused';
    },
    canContinue() {
        return this.contract.status == 'paused';
    }
});

Template.contractView.events({
    'click #acceptContract': function (event, tmpl) {
        acceptContract.call({contractId: tmpl.data.contract._id}, function (err, res) {
            console.log(err ? err : res);
        });
    },

    'click #declineContract': function (event, tmpl) {
        declineContract.call({contractId: tmpl.data.contract._id}, function (err, res) {
            console.log(err ? err : res);
        });
    },

    'click #pauseContract': function (event, tmpl) {
        pauseContract.call({contractId: tmpl.data.contract._id}, function (err, res) {
            console.log(err ? err : res);
        });
    },

    'click #endContract': function (event, tmpl) {
        endContract.call({contractId: tmpl.data.contract._id}, function (err, res) {
            console.log(err ? err : res);
        });
    },

    'click #continueContract': function (event, tmpl) {
        continueContract.call({contractId: tmpl.data.contract._id}, function (err, res) {
            console.log(err ? err : res);
        });
    }
});