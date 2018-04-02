import { UserEducation, EducationSchema } from './userEducations';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const addEducation = new ValidatedMethod({
    name: 'userEducations.addEducation',
    validate: EducationSchema.validator(),
    run(education) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('userEducations.addEducation.notLoggedIn',
                'Must be logged in to create notification.');
        }
        if(!education.isStudy){
            if (moment(education.startAt).isAfter(moment(education.completeAt))) {
                throw new Meteor.Error('userEducations.addEducation.validationError', 'Start date should be greater than complete date!');
            }
        }
        const id = UserEducation.insert(education);
        Meteor.users.update({
            _id: userId
        }, {
            $addToSet: {
                'profile.educationIds': id
            }
        }, function (err) {
            if (err) {
                throw new Meteor.Error('userEducations.addEducation.updateProfileError', 'Failed to update profile');
            }
        });
        return id;
    }
});

export const updateEducation = new ValidatedMethod({
    name: 'userEducations.updateEducation',
    validate: EducationSchema.validator(),
    run(education) {
        const userId = this.userId;
        const id = education._id;
        education = _.omit(education, '_id');
        if (!userId) {
            throw new Meteor.Error('userEducations.updateEducation.notLoggedIn',
                'Must be logged in to create notification.');
        }
        if(!education.isStudy){
            if (moment(education.startAt).isAfter(moment(education.completeAt))) {
                throw new Meteor.Error('userEducations.addEducation.validationError', 'Start date should be greater than complete date!');
            }
        }
        UserEducation.update({_id: id}, {$set: education}, function (error) {
            if (error) {
                throw new Meteor.Error(error.message);
            }
        });
    }
});

export const removeEducation = new ValidatedMethod({
    name: 'userEducations.removeEducation',
    validate: new SimpleSchema({
        educationId: {
            type: String
        }
    }).validator(),
    run({educationId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('userEducations.removeEducation.notLoggedIn',
                'Must be logged in to create notification.');
        }
        UserEducation.remove({_id: educationId});
        Meteor.users.update({_id: userId}, { $pull: { 'profile.educationIds': educationId }});
    }
});