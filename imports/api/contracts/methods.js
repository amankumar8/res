import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {Projects} from '/imports/api/projects/projects';
import {Contracts} from './contracts';
import {ContractsStatusChanges} from '/imports/api/contractsStatusChanges/contractsStatusChanges';
import {ContractSchema} from '/imports/api/contracts/contracts';
import {VZ} from '/imports/startup/both/namespace';
import moment from 'moment';
import moment_business from 'moment-business-days';
import {PublicHolidays} from '/imports/api/publicHolidays/publicHolidays';
import publicHolidaysMethods from '/imports/api/publicHolidays/methods';
import {TimeEntries} from '/imports/api/timeEntries/timeEntries';
import {Companies} from '/imports/api/companies/companies';

const { updateHolidays } = publicHolidaysMethods;
const oneHour = 1000 * 60 * 60;

export const createContract = new ValidatedMethod({
  name: 'contracts.createContract',
  validate: ContractSchema.pick('userRole', 'name', 'workerId', 'paymentInfo', 'paymentInfo.type', 'paymentInfo.rate', 'paymentInfo.weekHoursLimit', 'companyId', 'projectIds', 'projectIds.$').validator(),
  run(contract) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('permission-error', 'You should be logged in to create contract!');
    }

    contract.employerId = userId;
    let userRole = contract.userRole;
    contract = _.omit(contract, 'userRole');
    let worker = Meteor.users.findOne(contract.workerId);
    if (!worker) {
      throw new Meteor.Error('invalid-data-error', 'Can not find a worker with given workerId!');
    }

    if (contract.companyId && !VZ.canUser('contractingAsCompanyWithWorker', contract.employerId, contract.companyId)) {
      throw new Meteor.Error('permission-error', 'You don\'n have permissions to contracting worker to this company!');
    }

    contract.createdAt = new Date();
    contract.status = 'pending';
    contract.trackingInfo = {};
    contract.trackingInfo.allTime = [];
    contract.trackingInfo.thisMonth = { tracked: 0, earned: 0 };
    contract.trackingInfo.thisWeek = { tracked: 0, earned: 0 };

    let contractId = Contracts.insert(contract);
    changeContractStatus.call({contractId: contractId, status: 'pending', userId: contract.employerId});

    // TODO: assign user to project, if projectId exists

    Roles.addUsersToRoles(userId, 'contract-employer', contractId);
    Roles.addUsersToRoles(worker._id, 'contract-worker', contractId);

    for (let i = 0; i < contract.projectIds.length; i++) {
      let isInProject = Roles.userIsInRole(worker._id, ['project-worker, project-viewer'], contract.projectIds[i]);
      if (isInProject) {
        let project = Projects.findOne({_id: contract.projectIds[i]});
        let projectName = project && project.name;
        throw new Meteor.Error('invalid-data-error', 'User is already a assigned to ' + projectName);
      }
      // Roles.addUsersToRoles(worker._id, userRole, contractId);
      Roles.addUsersToRoles(worker._id, userRole, contract.projectIds[i]);
    }
    if (userRole == 'project-worker') {
      Projects.update({_id: {$in: contract.projectIds}}, {$addToSet: {assignedUsersIds: worker._id}}, {multi: true});
    }

    if (contract.paymentInfo.type === 'monthly') {
      updateUserCountryHolidays(worker._id, contractId);
    }
    return contractId;
  }
});

export const editContract = new ValidatedMethod({
  name: 'contracts.editContract',
  validate: ContractSchema.pick('_id', 'userRole', 'name', 'workerId', 'paymentInfo', 'paymentInfo.type', 'paymentInfo.rate', 'paymentInfo.weekHoursLimit', 'companyId', 'projectIds', 'projectIds.$').validator(),
  run(contract) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('permission-error', 'You should be logged in to create contract!');
    }
    let contractId = contract._id;
    contract = _.omit(contract, '_id');
    let currentContract = Contracts.findOne({_id: contractId});
    let contractProjectIds = currentContract.projectIds;
    contract.employerId = userId;
    let userRole = contract.userRole;
    contract = _.omit(contract, 'userRole');
    let worker = Meteor.users.findOne({_id: contract.workerId});
    if (!worker) {
      throw new Meteor.Error('invalid-data-error', 'Can not find a worker with given workerId!');
    }

    if (contract.companyId && !VZ.canUser('contractingAsCompanyWithWorker', contract.employerId, contract.companyId)) {
      throw new Meteor.Error('permission-error', 'You don\'n have permissions to contracting worker to this company!');
    }

    Projects.update({_id: {$in: contractProjectIds}}, {$pull: {assignedUsersIds: worker._id}}, {multi: true});
    for (let j = 0; j < contractProjectIds.length; j++) {
      Roles.removeUsersFromRoles(worker._id, 'project-worker', contractProjectIds[j]);
      Roles.removeUsersFromRoles(worker._id, 'project-viewer', contractProjectIds[j]);
    }

    Contracts.update({_id: contractId}, {$set: contract});

    // TODO: assign user to project, if projectId exists

    for (let i = 0; i < contract.projectIds.length; i++) {
      let isInProject = Roles.userIsInRole(worker._id, ['project-worker, project-viewer'], contract.projectIds[i]);
      if (isInProject) {
        let project = Projects.findOne({_id: contract.projectIds[i]});
        let projectName = project && project.name;
        throw new Meteor.Error('invalid-data-error', 'User is already a assigned to ' + projectName);
      }
      Roles.addUsersToRoles(worker._id, userRole, contract.projectIds[i]);
    }
    if (userRole === 'project-worker') {
      Projects.update({_id: {$in: contract.projectIds}}, {$addToSet: {assignedUsersIds: worker._id}}, {multi: true});
    }
    if (contract.paymentInfo.type === 'monthly') {
      updateUserCountryHolidays(worker._id, contractId);
    }
    return contractId;
  }
});

export const changeContractStatus = new ValidatedMethod({
  name: 'contracts.changeContractStatus',
  validate: new SimpleSchema({
    contractId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    status: {
      type: String
    },
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({contractId, status, userId}) {
    const currentUsedId = userId || this.userId;
    if (!currentUsedId) {
      throw new Meteor.Error('permission-error', 'You should be logged in to create contract!');
    }
    let contract = Contracts.findOne({_id: contractId});

    if (!contract) {
      throw new Meteor.Error('invalid-data', 'Can not find a contract with given id!');
    }

    Contracts.update(contractId, {$set: {status: status}});

    return ContractsStatusChanges.insert({
      contractId: contractId,
      status: status,
      changedAt: new Date(),
      changedByUserId: userId
    });
  }
});

export const acceptContract = new ValidatedMethod({
  name: 'contracts.acceptContract',
  validate: new SimpleSchema({
    contractId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({contractId}) {
    let userId = this.userId;
    if (!VZ.canUser('acceptContract', userId, contractId)) {
      throw new Meteor.Error('permission-error', 'You don\'t have permission to accept this contract!')
    }
    const contract = Contracts.findOne({ _id: contractId });
    if (contract.paymentInfo.type === 'monthly') {
      countDaysLeftThisMonth.call(contract);
    }

    return changeContractStatus.call({contractId, status: 'active', userId});
  }
});

export const declineContract = new ValidatedMethod({
  name: 'contracts.declineContract',
  validate: new SimpleSchema({
    contractId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({contractId}) {
    let userId = this.userId;
    if (!VZ.canUser('declineContract', userId, contractId)) {
      throw new Meteor.Error('permission-error', 'You don\'t have permission to decline this contract!')
    }

    return changeContractStatus.call({contractId, status: 'declined', userId});
  }
});

export const pauseContract = new ValidatedMethod({
  name: 'contracts.pauseContract',
  validate: new SimpleSchema({
    contractId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({contractId}) {
    let userId = this.userId;
    if (!VZ.canUser('pauseContract', userId, contractId)) {
      throw new Meteor.Error('permission-error', 'You don\'t have permission to pause this contract!')
    }

    return changeContractStatus.call({contractId, status: 'paused', userId});
  }
});

export const continueContract = new ValidatedMethod({
  name: 'contracts.continueContract',
  validate: new SimpleSchema({
    contractId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({contractId}) {
    let userId = this.userId;
    if (!VZ.canUser('endContract', userId, contractId)) {
      throw new Meteor.Error('permission-error', 'You don\'t have permission to end this contract!')
    }
    const contract = Contracts.findOne({ _id: contractId });
    if (contract.paymentInfo.type === 'monthly') {
      countDaysLeftThisMonth.call(contract);
    }

    return changeContractStatus.call({contractId, status: 'active', userId});
  }
});

export const deleteContract = new ValidatedMethod({
  name: 'contracts.deleteContract',
  validate: new SimpleSchema({
    contractId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({contractId}) {
    let userId = this.userId;
    if (!VZ.canUser('deleteContract', userId, contractId)) {
      throw new Meteor.Error('permission-error', 'You don\'t have permission to delete contract!')
    }

    let contract = Contracts.findOne(contractId);
    let workerId = contract.workerId;
    Contracts.remove({_id: contractId});
    Roles.removeUsersFromRoles(userId, 'contract-employer', contractId);
    Roles.removeUsersFromRoles(workerId, 'contract-worker', contractId);
  }
});

export const deleteContracts = new ValidatedMethod({
  name: 'contracts.deleteContracts',
  validate: new SimpleSchema({
    contractIds: {
      type: [String],
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({contractIds}) {
    let userId = this.userId;
    for (let i = 0; i < contractIds.length; i++) {
      let contract = Contracts.findOne({_id: contractIds[i]});
      if (!VZ.canUser('deleteContract', userId, contractIds[i])) {
        throw new Meteor.Error('permission-error', 'You don\'t have permission to delete ' + contract.name + ' contract!')
      }
    }
    for (let i = 0; i < contractIds.length; i++) {
      let contract = Contracts.findOne({_id: contractIds[i]});
      let workerId = contract.workerId;
      Contracts.remove({_id: contract._id});
      Roles.removeUsersFromRoles(userId, 'contract-employer', contract._id);
      Roles.removeUsersFromRoles(workerId, 'contract-worker', contract._id);
    }
  }
});

export const endContract = new ValidatedMethod({
  name: 'contracts.endContract',
  validate: new SimpleSchema({
    contractId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({contractId}) {
    let userId = this.userId;
    if (!VZ.canUser('endContract', userId, contractId)) {
      throw new Meteor.Error('permission-error', 'You don\'t have permission to end this contract!')
    }

    return changeContractStatus.call({contractId, status: 'ended', userId});
  }
});

export const updateUserCountryHolidays = function (userId, contractId) {
  if (!userId) {
    throw new Error('cannot update holidays without userId');
  }
  if (Meteor.isServer) {
    let userCountryCode;
    const countries = JSON.parse(Assets.getText('countriesWithGCalendar.json')).countries;
    const user = Meteor.users.findOne({ _id: userId }, { profile: 1 });
    if (user.profile.location && user.profile.location.country) {
      for (let code in countries) {
        if (countries[ code ].name === user.profile.location.country) {
          userCountryCode = code;
          break;
        }
      }
      if (!userCountryCode) {
        userCountryCode = 'JP';
      }
    } else {
      userCountryCode = 'JP';
    }
    Contracts.update({ _id: contractId }, { $set: { countryCode: userCountryCode } });
    updateHolidays.call({ countryCodes: [ userCountryCode ] });
  }
};

export const countDaysLeftThisMonth = new ValidatedMethod({
  name: 'contracts.countDaysLeftThisMonth',
  validate: null,
  run({ _id, countryCode, workingDaysThisMonth }) {
    if (Meteor.isServer) {
      const contractId = _id;
      const countryHolidays = PublicHolidays.findOne({
        countryCode
      }, { fields: { weekends: 1, holidays: 1 } });
      if (!countryHolidays) {
        throw new Error(`cannot find holidays for country code ${countryCode}`);
      }
      moment_business.locale(countryCode, {
        holidays: countryHolidays.holidays,
        holidayFormat: 'YYYY-MM-DD',
        workingWeekdays: [ 1, 2, 3, 4, 5, 6, 7 ].filter(item => !countryHolidays.weekends.includes(item))
      });
      const workingDaysLeft = moment_business().businessDiff(moment().add(1, 'month').startOf('month'));
      const timeEntries = TimeEntries.find({startDate: {$gte: moment().startOf('day').toDate()}, _isActive: false }).fetch();
      const workedToday = timeEntries.reduce((sum, timeEntry) => {
        sum += timeEntry.endDate - timeEntry.startDate;
        return sum;
      }, 0);
      const workingTimeLeftUpdated = workingDaysLeft * 8 * oneHour - workedToday;
      const workingDaysThisMonthUpdated = moment_business().monthBusinessDays().length;
      if (moment().date() === 1) {
        Contracts.update({ _id: contractId }, {
          $set: {
            workingDaysLastMonth: workingDaysThisMonth || 0,
            workingTimeLeft: workingTimeLeftUpdated,
            workingDaysThisMonth: workingDaysThisMonthUpdated
          }
        });
      } else {
        Contracts.update({ _id: contractId }, {
          $set: {
            workingTimeLeft: workingTimeLeftUpdated,
            workingDaysThisMonth: workingDaysThisMonthUpdated
          }
        });
      }
    }
  }
});

export const clientAppContractsAndUser = new ValidatedMethod({
  name: 'contracts.clientAppContractsAndUser',
  validate: new SimpleSchema({
    appUserId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({appUserId}) {
  	return clientAppContractsAndUserByStatus.call({ appUserId, status: "active" });
  }
});

export const clientAppContractsAndUserByStatus = new ValidatedMethod({
  name: 'contracts.clientAppContractsAndUserByStatus',
  validate: new SimpleSchema({
    appUserId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    },
    status: {
      type: String,
      optional: true
    }
  }).validator(),
  run({appUserId, status}) {
    const userId = appUserId || this.userId;
    if (!userId) {
      throw new Error(`userId is required`);
    }
    const query = { workerId: userId };
    if (status) {
    	query.status = status;
    }
    let contracts = Contracts.find(query).fetch();

    contracts = contracts.map((contract) => {
      let employer = Meteor.users.findOne({_id: contract.employerId});
      let worker = Meteor.users.findOne({_id: contract.workerId});

      contract.employerName = employer && employer.profile && employer.profile.fullName;
      contract.workerName = worker && worker.profile && worker.profile.fullName;
      if(contract.companyId){
        let company = Companies.findOne({_id: contract.companyId});
        contract.companyName = company && company.name;
      }
      return contract;
    });
    return contracts;
  }
});