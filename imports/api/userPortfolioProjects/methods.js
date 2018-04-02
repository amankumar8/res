import { UserPortfolioProjects, PortfolioProjectsSchema } from './userPortfolioProjects';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { uploadPhoto } from '/imports/api/google-services/google-api/methods';

export const updateThumbnail = new ValidatedMethod({
    name: 'userPortfolioProjects.updateThumbnail',
    validate: null,
    run({buffer, type, name}) {
        const userId = this.userId;
        let currentTime = moment().unix();

        if (!userId) {
            throw new Meteor.Error('userPortfolioProjects.updateThumbnail.notLoggedIn',
                'Must be logged in.');
        }
        let fileName = userId + '_' + currentTime + '_' + name;
        let params = {
            name: fileName,
            type: type,
            buffer: buffer,
            bucketName: 'vezio_portfolio_images'
        };
        try {
            let mediaLink = uploadPhoto.call(params);
            return mediaLink;
        } catch (e) {
            return e;
        }
    }
});

export const insertPortfolioProject = new ValidatedMethod({
    name: 'userPortfolioProjects.insertPortfolioProject',
    validate: PortfolioProjectsSchema.validator(),
    run(portfolio) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('userPortfolioProjects.insertPortfolioProject.notLoggedIn',
                'Must be logged in.');
        }
        const id = UserPortfolioProjects.insert(portfolio);
        Meteor.users.update({
            _id: userId
        }, {
            $addToSet: {
                'profile.portfolioProjects': id
            }
        }, function (err) {
            if (err) {
                throw new Meteor.Error('userPortfolioProjects.insertPortfolioProject.profileUpdateError', 'Failed to update profile');
            }
        });
    }
});

export const updatePortfolioProject = new ValidatedMethod({
    name: 'userPortfolioProjects.updatePortfolioProject',
    validate: PortfolioProjectsSchema.validator(),
    run(portfolio) {
        const userId = this.userId;
        const portfolioId = portfolio._id;
        portfolio = _.omit(portfolio, '_id');
        if (!userId) {
            throw new Meteor.Error('userPortfolioProjects.updatePortfolioProject.notLoggedIn',
                'Must be logged in.');
        }
        UserPortfolioProjects.update({_id: portfolioId}, {$set: portfolio}, function (error) {
            if (error) {
                throw new Meteor.Error('userPortfolioProjects.updatePortfolioProject.updateError', error.message);
            }
        });
    }
});

export const removePortfolioProject = new ValidatedMethod({
    name: 'userPortfolioProjects.removePortfolioProject',
    validate: new SimpleSchema({
        portfolioId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({portfolioId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('userPortfolioProjects.removePortfolioProject.notLoggedIn',
                'Must be logged in.');
        }
        UserPortfolioProjects.remove(portfolioId);
        Meteor.users.update({_id: userId}, { $pull: { 'profile.portfolioProjects': portfolioId }});
    }
});