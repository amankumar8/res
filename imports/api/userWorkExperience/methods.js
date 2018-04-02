import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { UserWorkExperience, WorkExperienceSchema } from './userWorkExperience';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export const addWorkExperience = new ValidatedMethod({
    name: 'userWorkExperience.addWorkExperience',
    validate: WorkExperienceSchema.validator(),
    run(job) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('userWorkExperience.addWorkExperience.notLoggedIn',
                'Must be logged in.');
        }
        if(!job.isWorking){
            if (moment(job.startAt).isAfter(moment(job.completeAt))) {
                throw new Meteor.Error('userWorkExperience.addWorkExperience.validationError', 'Start date should be greater than job complete date!');
            }
        }
        const id = UserWorkExperience.insert(job);
        Meteor.users.update({
            _id: userId
        }, {
            $addToSet: {
                'profile.workExperienceIds': id
            }
        }, function (err) {
            if (err) {
                throw new Meteor.Error('userWorkExperience.addWorkExperience.updateProfileError', 'Failed to update profile');
            }
        });
    }
});

export const updateWorkExperience = new ValidatedMethod({
    name: 'userWorkExperience.updateWorkExperience',
    validate: WorkExperienceSchema.validator(),
    run(job) {
        const userId = this.userId;
        const id = job._id;
        job = _.omit(job, '_id');
        if (!userId) {
            throw new Meteor.Error('userWorkExperience.updateWorkExperience.notLoggedIn',
                'Must be logged in.');
        }
        if(!job.isWorking){
            if (moment(job.startAt).isAfter(moment(job.completeAt))) {
                throw new Meteor.Error('userWorkExperience.removeWorkExperience.validationError', 'Start date should be greater than job complete date!');
            }
        }
        UserWorkExperience.update({_id: id}, {$set: job}, function (error) {
            if (error) {
                throw new Meteor.Error('userWorkExperience.removeWorkExperience.updateFail', error.message);
            }
        });
    }
});

export const removeWorkExperience = new ValidatedMethod({
    name: 'userWorkExperience.removeWorkExperience',
    validate: WorkExperienceSchema.validator(),
    run({id}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('userWorkExperience.removeWorkExperience.notLoggedIn',
                'Must be logged in.');
        }
        UserWorkExperience.remove(id);
        Meteor.users.update({_id: userId}, { $pull: { 'profile.workExperienceIds': id }});
    }
});