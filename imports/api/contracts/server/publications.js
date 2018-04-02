import {Meteor} from 'meteor/meteor';
import {Projects} from '/imports/api/projects/projects';
import {Tasks} from '/imports/api/tasks/tasks';
import {Contracts} from '../contracts';
import {Companies} from '/imports/api/companies/companies';
import {ContractsStatusChanges} from '/imports/api/contractsStatusChanges/contractsStatusChanges';
import {publishComposite} from 'meteor/reywood:publish-composite';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

publishComposite('contractList', function () {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  let query = {$or:[{workerId: userId}, {employerId: userId}]};
  let user = Meteor.users.findOne({_id: userId});
  let companyId = user.profile && user.profile.selectedCompanyId;
  if (companyId) {
    query.companyId = companyId;
  }
  const profileOptions = {
    fields: {profile: 1, roles: 1, emails: 1}
  };
  let children = [
    {
      find: function (contract) {
        let workerId = contract.workerId;
        let employerId = contract.employerId;
        return Meteor.users.find({_id: {$in: [workerId, employerId]}}, profileOptions);
      }
    }
  ];

  return {
    find: function () {
      return Contracts.find(query);
    },
    children: children
  }
});

publishComposite('editContract', function (contractId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    contractId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({contractId});

  let query = {_id: contractId, employerId: userId};

  const profileOptions = {
    fields: {profile: 1, roles: 1, emails: 1}
  };
  let children = [
    {
      find: function (contract) {
        let workerId = contract.workerId;
        return Meteor.users.find({_id: workerId}, profileOptions);
      }
    },
    {
      find: function (contract) {
        let projectIds = contract.projectIds || [];
        return Projects.find({_id: {$in: projectIds}});
      }
    },
    {
      find: function (contract) {
        let companyId = contract.companyId || '';
        return Companies.find({_id: companyId});
      }
    }
  ];

  return {
    find: function () {
      return Contracts.find(query);
    },
    children: children
  }
});

publishComposite('viewContract', function (contractId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    contractId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({contractId});

  let query = {_id: contractId, $or: [{employerId: userId}, {workerId: userId}]};

  const profileOptions = {
    fields: {profile: 1, roles: 1, emails: 1}
  };
  let children = [
    {
      find: function (contract) {
        let workerId = contract.workerId;
        return Meteor.users.find({_id: workerId}, profileOptions);
      }
    },
    {
      find: function (contract) {
        let projectIds = contract.projectIds || [];
        return Projects.find({_id: {$in: projectIds}});
      }
    },
    {
      find: function (contract) {
        let companyId = contract.companyId || '';
        return Companies.find({_id: companyId});
      }
    },
    {
      find: function (contract) {
        return ContractsStatusChanges.find({contractId: contract._id});
      }
    }
  ];

  return {
    find: function () {
      return Contracts.find(query);
    },
    children: children
  }
});

publishComposite('ownerContracts', function (isDashboardCard) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  new SimpleSchema({
    isDashboardCard: {
      type: Boolean,
      optional: true
    }
  }).validate({isDashboardCard});

  let query = {employerId: userId, status: {$in: ['active', 'paused']}};
  let user = Meteor.users.findOne({_id: userId});
  let companyId = user.profile && user.profile.selectedCompanyId;
  if (companyId) {
    query.companyId = companyId;
  }
  const profileOptions = {
    fields: {profile: 1, roles: 1, emails: 1}
  };
  let children = [
    {
      find: function (contract) {
        return Meteor.users.find({_id: contract.workerId}, profileOptions);
      }
    },
    {
      find: function (contract) {
        return Companies.find({_id: contract.companyId});
      }
    }
  ];
  if (isDashboardCard) {
    children = [{
      find: function (contract) {
        return Meteor.users.find({_id: contract.workerId}, profileOptions);
      }
    }];
  }
  return {
    find: function () {
      return Contracts.find(query);
    },
    children: children
  }
});


Meteor.publish('userContracts', function () {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  return Contracts.find({workerId: userId});
});

Meteor.publish('earningsCardData', function () {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  return Tasks.find({
    $and: [{membersIds: userId}, {trackingInfo: {$exists: true}}], $or: [
      {'trackingInfo.allUsers.today.tracked': {$gt: 0}},
      {'trackingInfo.allUsers.yesterday.tracked': {$gt: 0}},
      {'trackingInfo.allUsers.thisWeek.tracked': {$gt: 0}},
      {'trackingInfo.allUsers.lastWeek.tracked': {$gt: 0}},
      {'trackingInfo.allUsers.thisMonth.tracked': {$gt: 0}},
      {'trackingInfo.allUsers.lastMonth.tracked': {$gt: 0}}
    ]
  }, {fields: {trackingInfo: 1, membersIds: 1, name: 1, taskKey: 1, projectId: 1, archived: 1, status: 1}});
});

publishComposite('spendingsCardData', function (companyId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    companyId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validate({companyId});
  return {
    find: function () {
      let query = {employerId: userId, status: {$in: ['active', 'paused']}};
      if (companyId) {
        query.companyId = companyId;
      }
      return Contracts.find(query);
    },
    children: [
      {
        find: function (contract) {
          return Meteor.users.find({_id: contract.workerId}, {
            fields: {profile: 1, roles: 1, emails: 1}
          });
        }
      },
      {
        find: function (contract) {
          return Tasks.find({
            $and: [{membersIds: contract.workerId}, {trackingInfo: {$exists: true}}],
            $or: [
              {'trackingInfo.allUsers.today.tracked': {$gt: 0}},
              {'trackingInfo.allUsers.yesterday.tracked': {$gt: 0}},
              {'trackingInfo.allUsers.thisWeek.tracked': {$gt: 0}},
              {'trackingInfo.allUsers.lastWeek.tracked': {$gt: 0}},
              {'trackingInfo.allUsers.thisMonth.tracked': {$gt: 0}},
              {'trackingInfo.allUsers.lastMonth.tracked': {$gt: 0}}
            ]
          }, {
            fields: {
              trackingInfo: 1,
              membersIds: 1,
              name: 1,
              taskKey: 1,
              projectId: 1,
              archived: 1,
              status: 1
            }
          });
        }
      }
    ]
  }
});

Meteor.publish('clientAppContracts', function (appUserId) {
  const userId = appUserId || this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({userId});

  return Contracts.find({
    workerId: userId,
    status: "active"
  });
});

Meteor.publish('userContractsById', function (userId) {
    return Contracts.find({workerId: userId});
});