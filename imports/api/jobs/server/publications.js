import {Countries} from '/imports/api/countries/countries';
import {Skills} from '/imports/api/skills/skills';
import {Jobs} from '../jobs';
import {VZ} from '/imports/startup/both/namespace';
import {publishComposite} from 'meteor/reywood:publish-composite';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {Companies} from '/imports/api/companies/companies';
import {Industries} from '/imports/api/industries/industries';
import {Positions} from '/imports/api/positions/positions';

publishComposite('job', function (jobId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    jobId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({jobId});

  if (VZ.canUser('viewJob', userId, jobId)) {
    return {
      find: function () {
        return Jobs.find(jobId);
      },
      children: [
        {
          find: function (job) {
            let skillsIds = job.skillsIds || [];
            return Skills.find({_id: {$in: skillsIds}});
          }
        }
      ]
    }
  } else {
    this.ready();
  }
});

Meteor.publish('userSkillsByRegEx', function (searchString) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    searchString: {
      type: String,
      optional: true
    }
  }).validate({searchString});

  let user = Meteor.users.findOne({_id: userId});
  let skillsIds = user && user.profile && user.profile.skills;
  let searchParams = {};
  if (searchString != '') {
    let searchStringRegExp = new RegExp(searchString, 'ig');
    searchParams.$or = [{label: {$regex: searchStringRegExp}},
      {_id: {$in: skillsIds}}
    ];
  } else {
    searchParams.$or = [{label: 'no-skill'},
      {_id: {$in: skillsIds}}
    ];
  }
  return Skills.find(searchParams, {fields: {_id: 1, label: 1, isArchived: 1}});
});

Meteor.publish('userSkills', function (userId) {
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({userId});

  let user = Meteor.users.findOne({_id: userId});
  let skillsIds = user.profile.skills || [];
  let searchParams = {};
  searchParams._id = {$in: skillsIds};
  return Skills.find(searchParams, {fields: {_id: 1, label: 1, isArchived: 1}});
});

Meteor.publish('userJobs', function (params = {}, options = {}) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  params.ownerId = this.userId;
  return Jobs.find(params, options);
});

Meteor.publish('jobs', function (params = {}, options = {}) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  return Jobs.find(params, options);
});
Meteor.publish('allCountries', function () {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  return Countries.find({}, {sort: {label: 1}});
});

Meteor.publish('allSkills', function (isNotArchived) {
  if (!this.userId) {
    return this.ready();
  }
  new SimpleSchema({
    isNotArchived: {
      type: Boolean,
      optional: true
    }
  }).validate({isNotArchived});

  let query = {};
  if (isNotArchived) {
    query.isArchived = false;
  }
  return Skills.find(query);
});

Meteor.publish('allSkillsForAdmin', function (userId) {
  if (userId === 'wh8or4SeGKKr5WTDs' || this.userId) {
    return Skills.find();
  } else {
    return this.ready();
  }
});


Meteor.publish('oneSkillForAdmin', function (id, userId) {
  if (userId === 'wh8or4SeGKKr5WTDs' || this.userId) {
    return Skills.find({_id: id});
  } else {
    return this.ready();
  }
});

Meteor.publish('oneSkillById', function (id) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    return Skills.find({_id: id});

});

Meteor.publish('allJobsForAdmin', function (userId) {
  if (userId === 'wh8or4SeGKKr5WTDs' || this.userId) {
    return Jobs.find();
  } else {
    return this.ready();
  }
});
Meteor.publish('oneJobForAdmin', function (id, userId) {
  if (userId === 'wh8or4SeGKKr5WTDs' || this.userId) {
    return Jobs.find({_id: id});
  } else {
    return this.ready();
  }
});

Meteor.publish('userSkillsForAdmin', function (userId) {
  if (!userId) {
    return this.ready();
  }
  let user = Meteor.users.findOne({_id: userId});
  let skillsIds = user && user.profile && user.profile.skills || [];
  let searchParams = {};
  searchParams._id = {$in: skillsIds};
  return Skills.find(searchParams);
});

publishComposite('jobs.company.datatable', function (userId, query, options) {
  if (userId === 'wh8or4SeGKKr5WTDs' || this.userId) {
    return {
      find: function () {
        return Jobs.find(query, options);
      },
      children: [
        {
          find: function (job) {
            return Companies.find({_id: job.companyId}, {fields: {name: 1}});
          }
        },
        {
          find: function (job) {
            let skillsIds = job.skillsIds || [];
            return Skills.find({_id: {$in: skillsIds}}, {fields: {label: 1}});
          }
        },
        {
          find: function (job) {
            return Industries.find({_id: job.categoryId}, {fields: {name: 1}});
          }
        },
        {
          find: function (job) {
            return Positions.find({_id: job.positionId}, {fields: {name: 1}});
          }
        },
        {
          find: function (job) {
            let createdBy = job.createdBy || '';
            let modifiedBy = job.modifiedBy || '';
            let ownerId = job.ownerId || '';
            return Meteor.users.find({_id: {$in: [createdBy, modifiedBy, ownerId]}}, {fields: {emails: 1}});
          }
        }
      ]
    }
  } else {
    return this.ready();
  }
});