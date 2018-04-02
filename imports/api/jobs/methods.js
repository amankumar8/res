import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Jobs, JobsSchema } from './jobs';
import { JobsChecker } from './jobs-checker';
import { Companies } from '/imports/api/companies/companies';
import { VZ } from '/imports/startup/both/namespace';
import { _ } from 'meteor/underscore';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const createJob = new ValidatedMethod({
    name: 'jobs.createJob',
    validate: JobsSchema.validator(),
    run(jobObject) {
        const userId = this.userId;
        let date = new Date();
        if (!userId) {
            throw new Meteor.Error('jobs.createJob.notLoggedIn',
                'Must be logged in to create jobs.');
        }
        const userCompanies = Companies.find({ownerId: userId}, {sort: {createdAt: -1}}).fetch();
        if (userCompanies.length === 0) {
            throw new Meteor.Error('jobs.createJob.permissionError', 'Create company to add job !');
        }
        check(jobObject, JobsChecker);

        jobObject.ownerId = userId;
        jobObject.applicantsIds = [];
        jobObject.viewerIds = [];
        jobObject.status = 'Opened';

        jobObject.isArchived = false;
        jobObject.createdAt = date;
        jobObject.isDraft = true;

        let currentDate = moment(date);
        let futureMonth = currentDate.add(1, 'months').format('MM/DD/YYYY');
        jobObject.expireAt = new Date(futureMonth);
        let jobId = Jobs.insert(jobObject);

        Roles.addUsersToRoles(userId, 'job-owner', jobId);

        return jobId;
    }
});

export const editJob = new ValidatedMethod({
    name: 'jobs.editJob',
    validate: JobsSchema.validator(),
    run(jobObject) {
        const userId = this.userId;
        const jobId = jobObject._id;
        jobObject = _.omit(jobObject, '_id');
        if (!userId) {
            throw new Meteor.Error('jobs.createJob.notLoggedIn',
                'Must be logged in to update jobs.');
        }
        if (!VZ.canUser('editJob', userId, jobId)) {
            throw new Meteor.Error('jobs.editJob.permissionError', 'You can\' edit this job!');
        }
        check(jobObject, JobsChecker);
        Jobs.update({_id: jobId}, {$set: jobObject});
    }
});

export const editWorkerLocation = new ValidatedMethod({
    name: 'jobs.editWorkerLocation',
    validate: new SimpleSchema({
        _id: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            optional: true
        },
        workerLocation: {
            type: Object,
            optional: true
        },
        'workerLocation.isRestricted':{
            type: Boolean,
            optional: true
        },
        'workerLocation.continent':{
            type: String,
            optional: true
        },
        'workerLocation.country':{
            type: String,
            optional: true
        }
    }).validator(),
    run(jobObject) {
        const userId = this.userId;
        const jobId = jobObject._id;
        jobObject = _.omit(jobObject, '_id');
        if (!userId) {
            throw new Meteor.Error('jobs.editWorkerLocation.notLoggedIn',
                'Must be logged in to update jobs.');
        }
        if (!VZ.canUser('editJob', userId, jobId)) {
            throw new Meteor.Error('jobs.editWorkerLocation.permissionError', 'You can\' edit this job!');
        }
        if (!jobObject.workerLocation) {
            throw new Meteor.Error('jobs.editWorkerLocation.validationError', 'Select location');
        }
        if (jobObject.workerLocation.isRestricted) {
            if (!jobObject.workerLocation.continent) {
                throw new Meteor.Error('jobs.editWorkerLocation.validationError', 'Select continent');
            }
            if (!jobObject.workerLocation.country) {
                throw new Meteor.Error('jobs.editWorkerLocation.validationError', 'Select country');
            }
        }
        Jobs.update({_id: jobId}, {$set: jobObject});
    }
});

export const archiveJobs = new ValidatedMethod({
    name: 'jobs.archiveJobs',
    validate: new SimpleSchema({
        jobsIds: {type: [String]}
    }).validator(),
    run({jobsIds}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('jobs.archiveJobs.notLoggedIn',
                'Must be logged in to archive jobs.');
        }
        if (jobsIds.length > 0) {
            for (let i = 0; i < jobsIds.length; i++) {
                Jobs.update({_id: jobsIds[i]}, {
                    $set: {
                        isArchived: true
                    }
                });
            }
        }
    }
});

export const restoreJobs = new ValidatedMethod({
    name: 'jobs.restoreJobs',
    validate: new SimpleSchema({
        jobsIds: {type: [String]}
    }).validator(),
    run({jobsIds}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('jobs.restoreJobs.notLoggedIn',
                'Must be logged in to restore jobs.');
        }
        if (jobsIds.length > 0) {
            for (let i = 0; i < jobsIds.length; i++) {
                Jobs.update({_id: jobsIds[i]}, {
                    $set: {
                        isArchived: false
                    }
                });
            }
        }
    }
});

export const applyForJob = new ValidatedMethod({
    name: 'jobs.applyForJob',
    validate: new SimpleSchema({
        jobId: {type: String}
    }).validator(),
    run({jobId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('jobs.applyForJob.notLoggedIn',
                'Must be logged in to restore jobs.');
        }
        Jobs.update({_id: jobId}, {$addToSet: {'applicantsIds': userId}});
    }
});

export const archiveJob = new ValidatedMethod({
    name: 'jobs.archiveJob',
    validate: new SimpleSchema({
        jobId: {type: String}
    }).validator(),
    run({jobId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('jobs.archiveJob.notLoggedIn',
                'Must be logged in to archive jobs.');
        }
        if (!VZ.canUser('archiveJob', userId, jobId)) {
            throw new Meteor.Error('permissionError', 'You can\' archive this job!');
        }
        Jobs.update({_id: jobId}, {$set: {isArchived: true}});
    }
});

export const restoreJob = new ValidatedMethod({
    name: 'jobs.restoreJob',
    validate: new SimpleSchema({
        jobId: {type: String}
    }).validator(),
    run({jobId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('jobs.restoreJob.notLoggedIn',
                'Must be logged in to restore jobs.');
        }
        if (!VZ.canUser('archiveJob', userId, jobId)) {
            throw new Meteor.Error('permissionError', 'You can\' restore this job!');
        }
        Jobs.update({_id: jobId}, {$set: {isArchived: false}});    }
});

export const addViewCount = new ValidatedMethod({
    name: 'jobs.addViewCount',
    validate: new SimpleSchema({
        jobId: {type: String}
    }).validator(),
    run({jobId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('jobs.addViewCount.notLoggedIn',
                'Must be logged in to view job.');
        }
        let job = Jobs.findOne({_id: jobId});
        let viewerIds = job.viewerIds || [];
        if (_.indexOf(viewerIds, userId) == -1) {
            Jobs.update({_id: jobId}, {$addToSet: {'viewerIds': userId}});
        }
    }
});

const jobsCompanyDataTableCount = new ValidatedMethod({
    name: 'jobs.company.datatable.count',
    validate: ()=>{},
    run(query,options) {
        return Jobs.find(query,options).count();
    }
});