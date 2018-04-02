import { VZ } from '/imports/startup/both/namespace';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Meteor } from 'meteor/meteor';
import { Skills } from '/imports/api/skills/skills.js';
import { updateProfileSchema, updateProfileMediaSchema } from './assigned-users';
import { uploadPhoto } from '/imports/api/google-services/google-api/methods';

export const updateSelectedCompanyId = new ValidatedMethod({
    name: 'users.updateSelectedCompanyId',
    validate: new SimpleSchema({
        selectedCompanyId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            optional: true
        }
    }).validator(),
    run({selectedCompanyId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.updateSelectedCompanyId.notLoggedIn',
                'Must be logged in.');
        }
        let query = {
        };
        if(selectedCompanyId){
            query.$set = {'profile.selectedCompanyId': selectedCompanyId}
        }
        else {
            query.$unset = {'profile.selectedCompanyId': ''}
        }
        Meteor.users.update({_id: userId}, query, function (err) {
            if (err) {
                throw new Meteor.Error('Failed tp update selected company');
            }
        });
    }
});

export const updateSelectedJobId = new ValidatedMethod({
    name: 'users.updateSelectedJobId',
    validate: new SimpleSchema({
        selectedJobId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            optional: true
        }
    }).validator(),
    run({selectedJobId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.updateSelectedJobId.notLoggedIn',
                'Must be logged in.');
        }
        let query = {
        };
        if(selectedJobId){
            query.$set = {'profile.selectedJobId': selectedJobId}
        }
        else {
            query.$unset = {'profile.selectedJobId': ''}
        }
        Meteor.users.update({_id: userId}, query, function (err) {
            if (err) {
                throw new Meteor.Error('Failed tp update selected job');
            }
        });
    }
});

export const editBiography = new ValidatedMethod({
    name: 'users.editBiography',
    validate: new SimpleSchema({
        biography: {
            type: String
        }
    }).validator(),
    run({biography}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.editBiography.notLoggedIn',
                'Must be logged in.');
        }
        Meteor.users.update({_id: userId}, {$set: {'profile.biography': biography}}, function (err) {
            if (err) {
                throw new Meteor.Error('Failed');
            }
        });
    }
});

export const addSearchQuery = new ValidatedMethod({
    name: 'users.addSearchQuery',
    validate: new SimpleSchema({
        query: {
            type: String
        }
    }).validator(),
    run({query}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.addSearchQuery.notLoggedIn',
                'Must be logged in.');
        }
        let searchHistory;
        let user = Meteor.users.findOne({_id: userId});
        if (user.profile.searchHistory) {
            searchHistory = user.profile.searchHistory;
            searchHistory.push(query);
            searchHistory = _.uniq(searchHistory).slice(-30);
        } else {
            searchHistory = [query];
        }

        Meteor.users.update({_id: userId}, {
            $set: {
                "profile.searchHistory": searchHistory
            }
        });
    }
});

export const getLargePhoto = new ValidatedMethod({
    name: 'users.getLargePhoto',
    validate: new SimpleSchema({
        userId: {
            type: String,
            optional: true
        }
    }).validator(),
    run({userId}) {
        const userId1 = userId || this.userId;
        if (!userId1) {
            throw new Meteor.Error('users.getLargePhoto.notLoggedIn',
                'Must be logged in.');
        }
        if(Meteor.isServer){
            import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';
            let Google = new GoogleApi();
            let bucket = 'vezio_avatars';
            let name = userId1 + '_large';
            return Google.getFile(bucket, name, function (err, res) {
                if (err) {
                    throw new Meteor.Error('Failed to download or not set')
                }
                else {
                    return res.data.mediaLink
                }
            });
        }
    }
});

export const updateProfile = new ValidatedMethod({
    name: 'users.updateProfile',
    validate: updateProfileSchema.validator(),
    run(params) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.updateProfile.notLoggedIn',
                'Must be logged in.');
        }

        let skills = Skills.find({label: {$in: params.skills}}).fetch();
        let skillsIds = _.map(skills, function (skill) {
            return skill._id;
        });
        let fullName = params.firstName + ' ' + params.lastName;
        let userParams = {
            'profile.firstName': params.firstName,
            'profile.lastName': params.lastName,
            'profile.fullName': fullName,
            'profile.overview': params.overview,
            'profile.location': params.location,
            'profile.skills': skillsIds,
            'profile.hourlyRate': params.hourlyRate,
            'profile.availabilityTime': params.availabilityTime,
            'profile.getInvitations': params.getInvitations
        };
        Meteor.users.update({_id: userId}, {$set: userParams}, function (err) {
            if (err) {
                throw new Meteor.Error('users.updateProfile.updateFail', 'Update fail');
            }
        });
    }
});

export const updatePaswordChange = new ValidatedMethod({
    name: 'users.updatePaswordChange',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.updatePaswordChange.notLoggedIn',
                'Must be logged in.');
        }
        let date = new Date();
        let userParams = {
            'profile.passwordUpdated': date
        };
        Meteor.users.update({_id: userId}, {$set: userParams}, function (err) {
            if (err) {
                throw new Meteor.Error('users.updatePaswordChange.updateFail', 'Update fail');
            }
        });
    }
});

export const updateProfileMedia = new ValidatedMethod({
    name: 'users.updateProfileMedia',
    validate: updateProfileMediaSchema.validator(),
    run(params) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.updateProfileMedia.notLoggedIn',
                'Must be logged in.');
        }
        let userParams = {
            'profile.languages': params.languages,
            'profile.personalWebsite': params.personalWebsite,
            'profile.socialMedias': params.socialMedias
        };
        Meteor.users.update({_id: userId}, {$set: userParams}, function (err) {
            if (err) {
                throw new Meteor.Error('Update fail');
            }
        });
    }
});

export const changeAvailability = new ValidatedMethod({
    name: 'users.changeAvailability',
    validate: new SimpleSchema({
        availability: {
            type: Boolean
        }
    }).validator(),
    run({availability}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.changeAvailability.notLoggedIn',
                'Must be logged in.');
        }
        Meteor.users.update(
            {_id: userId},
            {$set: {'profile.availability': availability}},
            function (err) {
                if (err) {
                    throw new Meteor.Error('users.changeAvailability.fail','Failed');
                }
            }
        );
    }
});

export const closeAccount = new ValidatedMethod({
    name: 'users.closeAccount',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.closeAccount.notLoggedIn',
                'Must be logged in.');
        }
        Meteor.users.update({_id: userId}, {$set: {status: 'closed'}}, function (err) {
            if (err) {
                throw new Meteor.Error('users.changeAvailability.accountCloseFailed','Account close failed');
            }
        });
    }
});

export const editName = new ValidatedMethod({
    name: 'users.editName',
    validate: new SimpleSchema({
        firstName: {
            type: String
        },
        lastName: {
            type: String
        }
    }).validator(),
    run({firstName, lastName}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.editName.notLoggedIn',
                'Must be logged in.');
        }
        let fullName = firstName + ' ' + lastName;
        Meteor.users.update(
            {_id: userId},
            {$set: {'profile.firstName': firstName, 'profile.lastName': lastName, 'profile.fullName': fullName}},
            function (err) {
                if (err) {
                    throw new Meteor.Error('users.editName.editNameFail', 'Name editing failed');
                }
            }
        );

    }
});

export const editDescription = new ValidatedMethod({
    name: 'users.editDescription',
    validate: new SimpleSchema({
        description: {
            type: String
        }
    }).validator(),
    run({description}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.editDescription.notLoggedIn',
                'Must be logged in.');
        }
        Meteor.users.update(
            {_id: userId},
            {$set: {'profile.description': description}},
            function (err) {
                if (err) {
                    throw new Meteor.Error('Description editing failed');
                }
            }
        );
    }
});

export const updateBackgroundPhoto = new ValidatedMethod({
    name: 'users.updateBackgroundPhoto',
    validate: null,
    run({buffer, type}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.updateBackgroundPhoto.notLoggedIn',
                'Must be logged in.');
        }
        let params = {
            name: userId,
            type: type,
            buffer: buffer,
            bucketName: 'vezio_profile_backgrounds'
        };
        try {
            let mediaLink = uploadPhoto.call(params);
            Meteor.users.update({_id: userId}, {$set: {'profile.photo.background': mediaLink}});
        } catch (e) {
            return e;
        }
    }
});

export const updateProfilePhoto = new ValidatedMethod({
    name: 'users.updateProfilePhoto',
    validate: null,
    run({smallBuffer, largeBuffer, type}) {
        const userId = this.userId;
        let typeRegEx = /^image\/(jpeg|JPEG|png|PNG|gif|GIF|tif|TIF)$/;

        if (!userId) {
            throw new Meteor.Error('users.updateProfilePhoto.notLoggedIn',
                'Must be logged in.');
        }
        if (!typeRegEx.test(type)) {
            throw new Meteor.Error('users.updateProfilePhoto.wrongImageType', 'Wrong img type!');
        }

        let smallImg = {
            name: userId + '_small',
            type: type,
            size: smallBuffer.length,
            data: smallBuffer,
            perms: 'publicRead'
        };
        let largeImg = {
            name: userId + '_large',
            type: type,
            size: largeBuffer.length,
            data: largeBuffer,
            perms: 'publicRead'
        };
        if(Meteor.isServer) {
            import {GoogleApi} from '/imports/api/google-services/server/google-api/connector';
            let Google = new GoogleApi();
            let res = {
                small: uploadProfilePhoto(Google, smallImg),
                large: uploadProfilePhoto(Google, largeImg)
            };
            Meteor.users.update({_id: userId}, {
                $set: {
                    'profile.photo.small': res.small,
                    'profile.photo.large': res.large
                }
            }, function (err) {
                if (err) {
                    throw new Meteor.Error('Failed to upload photo, try again');
                }
            });
        }
    }
});

export const checkResetPasswordToken = new ValidatedMethod({
    name: 'users.checkResetPasswordToken',
    validate: new SimpleSchema({
        token: {
            type: String
        }
    }).validator(),
    run({token}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('users.checkResetPasswordToken.notLoggedIn',
                'Must be logged in.');
        }
        let userWithThisToken = Meteor.users.findOne({
            'services.password.reset.token': token
        });

        if (userWithThisToken) {
            let passwordResetData = userWithThisToken.services.password.reset;
            let tokenWasTakenAtMoment = moment(passwordResetData.when);
            let currentMoment = moment();

            let diff = currentMoment.diff(tokenWasTakenAtMoment, 'minutes');

            let tokenExpiredInterval = 10;
            // token valid for 10 minutes
            if (diff < tokenExpiredInterval) {
                return true;
            } else {
                throw  new Meteor.Error('users.checkResetPasswordToken.tokenExpired', 'Tokes was expired!');
            }
        } else {
            throw new Meteor.Error('users.checkResetPasswordToken.tokenInvalid', 'Token is invalid!');
        }
    }
});

export const setTimeLogout = new ValidatedMethod({
    name: 'setTimeLogout',
    validate: null,
    run(user) {
        let logOutTime = new Date();
        Meteor.users.update({_id: user._id}, {$set: {'profile.lastOnline': logOutTime}});
    }
});

export const setPassword = new ValidatedMethod({
    name: 'setPassword',
    validate: new SimpleSchema({
        password: {
            type: String
        }
    }).validator(),
    run({password}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('setPassword.notLoggedIn',
                'Must be logged in.');
        }
        Accounts.setPassword(userId, password, {logout: false});
    }
});

export const archiveUser = new ValidatedMethod({
    name: 'archiveUser',
    validate: new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        },
        archivedBy: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({userId, archivedBy}) {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('archiveUser.notLoggedIn',
                'Must be logged in.');
        }
        let archivedAt = new Date();
        let user = Meteor.users.findOne({_id: userId});
        if (user) {
            Meteor.users.update({_id: userId}, {$set: {'profile.isArchived': true, 'profile.archivedAt': archivedAt, 'profile.archivedBy': archivedBy}});
        }
        else {
            throw new Meteor.Error('archiveUser.userNotFound', 'User not found');
        }
    }
});

export const restoreUser = new ValidatedMethod({
    name: 'restoreUser',
    validate: new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({userId}) {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('restoreUser.notLoggedIn',
                'Must be logged in.');
        }
        let user = Meteor.users.findOne({_id: userId});
        if (user) {
            Meteor.users.update({_id: userId}, {$set: {'profile.isArchived': false}});
        }
        else {
            throw new Meteor.Error('restoreUser.userNotFound', 'User not found');
        }
    }
});

export const blockUser = new ValidatedMethod({
    name: 'blockUser',
    validate: new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        },
        blockedBy: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        },
        blockedWhy: {
            type: String,
        }
    }).validator(),
    run({userId, blockedBy, blockedWhy}) {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('blockUser.notLoggedIn',
                'Must be logged in.');
        }
        let blockedAt = new Date();
        let user = Meteor.users.findOne({_id: userId});
        if (user) {
            Meteor.users.update({_id: userId}, {$set: {'profile.isBlocked': true, 'profile.blockedAt': blockedAt, 'profile.blockedBy': blockedBy, 'profile.blockedWhy': blockedWhy}});
        }
        else {
            throw new Meteor.Error('blockUser.userNotFound', 'User not found');
        }
    }
});

export const unblockUser = new ValidatedMethod({
    name: 'unblockUser',
    validate: new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({userId}) {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('unblockUser.notLoggedIn',
                'Must be logged in.');
        }
        let user = Meteor.users.findOne({_id: userId});
        if (user) {
            Meteor.users.update({_id: userId}, {$set: {'profile.isBlocked': false}});
        }
        else {
            throw new Meteor.Error('unblockUser.userNotFound', 'User not found');
        }
    }
});

export const archiveUsers = new ValidatedMethod({
    name: 'archiveUsers',
    validate: new SimpleSchema({
        userIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id,
        },
        archivedBy: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({userIds, archivedBy}) {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('archiveUsers.notLoggedIn',
                'Must be logged in.');
        }
        let archivedAt = new Date();
        Meteor.users.update({_id: {$in: userIds}}, {$set: {'profile.isArchived': true, 'profile.archivedAt': archivedAt, 'profile.archivedBy': archivedBy}}, {multi: true});
    }
});

export const restoreUsers = new ValidatedMethod({
    name: 'restoreUsers',
    validate: new SimpleSchema({
        userIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({userIds}) {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('restoreUsers.notLoggedIn', 'Must be logged in.');
        }
        Meteor.users.update({_id: {$in: userIds}}, {$set: {'profile.isArchived': false}}, {multi: true});
    }
});

export const blockUsers = new ValidatedMethod({
    name: 'blockUsers',
    validate: new SimpleSchema({
        userIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id,
        },
        blockedBy: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        },
        blockedWhy: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({userIds, blockedBy, blockedWhy}) {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('blockUsers.notLoggedIn', 'Must be logged in.');
        }
        let blockedAt = new Date();
        Meteor.users.update({_id: {$in: userIds}}, {$set: {'profile.isBlocked': true, 'profile.blockedAt': blockedAt, 'profile.blockedBy': blockedBy, 'profile.blockedWhy': blockedWhy}}, {multi: true});
    }
});

export const unblockUsers = new ValidatedMethod({
    name: 'unblockUsers',
    validate: new SimpleSchema({
        userIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id,
        }
    }).validator(),
    run({userIds}) {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('unblockUsers.notLoggedIn', 'Must be logged in.');
        }
        Meteor.users.update({_id: {$in: userIds}}, {$set: {'profile.isBlocked': false}}, {multi: true});
    }
});

export const confirmEmail = new ValidatedMethod({
    name: 'confirmEmail',
    validate: null,
    run() {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('confirmEmail.notLoggedIn', 'Must be logged in.');
        }
        if(VZ.helpers.isDev()){
            let user = Meteor.users.find(currentUserId).fetch()[0];

            if (user.emails && user.emails.length != 0) {
                let emails = user.emails;
                emails[0].verified = true;
                Meteor.users.update({_id: currentUserId}, {$set: {'emails': emails}})
            }
            else {
                return false;
            }
            return true;
        }
    }
});

export const removeUser = new ValidatedMethod({
    name: 'removeUser',
    validate: null,
    run() {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('removeUser.notLoggedIn', 'Must be logged in.');
        }
        Meteor.users.remove(currentUserId);
    }
});

export const removeAllUsers = new ValidatedMethod({
    name: 'removeAllUsers',
    validate: null,
    run() {
        const currentUserId = this.userId;
        if (!currentUserId) {
            throw new Meteor.Error('removeAllUsers.notLoggedIn', 'Must be logged in.');
        }
        Meteor.users.remove({});
    }
});

export const sendEmail = new ValidatedMethod({
    name: 'sendEmail',
    validate(args) {
        check(args, {
            to: String,
            from: String,
            subject: String,
            text: String,
        });
    },
    run({to, from, subject, text}) {
        if(Meteor.isServer){
            // Let other method calls from the same client start running,
            // without waiting for the email sending to complete.
            this.unblock();

            //actual email sending method
            Email.send({
                to: to,
                from: from,
                subject: subject,
                text: text
            });
        }
    }
});

export const sendVerificationEmail = new ValidatedMethod({
    name: 'sendVerificationEmail',
    validate: new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
        },
        email: {
            type: String,
            optional: true
        }
    }).validator(),
    run({userId, email}) {
        let response = {};

        if (email && userId) {

            Accounts.sendVerificationEmail(userId, email);
            response.success = true;
            return response;
        }
        else if (userId) {
            Accounts.sendVerificationEmail(userId);
            response.success = true;
            return response;
        }
        response.success = false;
        response.error = 'No user found';

        return response;
    }
});

let uploadProfilePhoto = function (Google, file) {
    return Google.uploadFile(file, 'vezio_avatars', function (err, res) {
        if (err) {
            throw new Meteor.Error("uploadError",err);
        }
        else {
            return res.data.mediaLink
        }
    })
};