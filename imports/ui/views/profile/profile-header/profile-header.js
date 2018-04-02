import { Meteor } from 'meteor/meteor';
import { VZ } from '/imports/startup/both/namespace';
import './profile-header.html';
import {Skills} from '/imports/api/skills/skills.js';
import { getTimeZoneNameFromCoordinates } from '/imports/api/google-services/google-api/methods';
import { updateProfile, changeAvailability } from '/imports/api/users/methods';

Template.profileHeader.onCreated(function () {
    let self = this;
    this.loadingPhoto = new ReactiveVar(false);
    this.loadingBackground = new ReactiveVar(false);
    this.timeZoneName = new ReactiveVar('');
    this.getUserCoordinates = function () {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile || !user.profile.location) {
            return;
        }
        let lat = user.profile.location.coordinates.lat;
        let lng = user.profile.location.coordinates.lng;

        getTimeZoneNameFromCoordinates.call({lat, lng}, function (error, result) {
            if (!error) {
                self.timeZoneName.set(result.timeZoneId);
            }
        });
    };
    this.autorun(() => {
        Template.currentData();
        let userId = Router.current().params.id;
        this.subscribe('user', userId);
        this.subscribe('userPresence', userId);
        this.subscribe('userDetailNext', userId);
        this.subscribe('userDetailPrev', userId);
        this.subscribe('userSkills', userId);
        this.getUserCoordinates();
    });
});

Template.profileHeader.events({
    'click .change-profile-pic': function (event, tmpl) {
        event.preventDefault();
        let parentNode = $('body')[0],
            onPhotoUpload = function (status) {
                tmpl.loadingPhoto.set(status);
            },
            modalData = {
                onPhotoUpload: onPhotoUpload
            };
        Blaze.renderWithData(Template.uploadPhotoModal, modalData, parentNode);
    },

    'click .change-cover-pic': function (event, tmpl) {
        event.preventDefault();
        let parentNode = $('body')[0],
            onPhotoUpload = function (status) {
                tmpl.loadingBackground.set(status);
            },
            modalData = {
                onPhotoUpload: onPhotoUpload
            };
        Blaze.renderWithData(Template.uploadBackgroundPhotoModal, modalData, parentNode);
    },

    'click .edit-icon': function (event, tmpl) {
        event.preventDefault();
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        if (!user || !user.profile) {
            return;
        }
        let profile = user && user.profile;
        let parentNode = $('body')[0],
            onUserEdit = function (user) {
                updateProfile.call(user, function (error, result) {
                    if (!error) {
                        VZ.notify('Success');
                    }
                    else {
                        VZ.notify(error.message)
                    }
                });
            },
            modalData = {
                profile: profile,
                onUserEdit: onUserEdit
            };
        Blaze.renderWithData(Template.editProfileModal, modalData, parentNode);
    },

    'click .show-on-map': function (event, tmpl) {
        event.preventDefault();
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        let parentNode = $('body')[0],
            modalData = {
                haveLocation: !!user.profile.location,
                coordinates: {
                    lat: user.profile.location.coordinates.lat,
                    lng: user.profile.location.coordinates.lng
                }
            };
        Blaze.renderWithData(Template.userLocationModal, modalData, parentNode);
    },
    'click #change-settings': function (event, tmpl) {
        event.preventDefault();
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        let availability = !user.profile.availability;
        changeAvailability.call({availability}, function (err, res) {
            if (err) {
              VZ.notify(error.message)
            }
        });
    },
    'click .prev': function (event, tmpl) {
        event.preventDefault();
        Router.go('userProfile', {id: this._id});
    },
    'click .next': function (event, tmpl) {
        event.preventDefault();
        Router.go('userProfile', {id: this._id});
    }
});

Template.profileHeader.helpers({
    profilePhoto() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (!user.profile.photo || !user.profile.photo.large) {
            return '/images/default-lockout.png'
        }

        return user.profile.photo.large;
    },

    backgroundPhoto() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (!user.profile.photo || !user.profile.photo.background) {
            return 'http://i.imgur.com/AMf9X7E.jpg'
        }
        // background: url({{backgroundPhoto}}); background-size:cover

        return user.profile.photo.background;
    },

    loadingPhoto() {
        return Template.instance().loadingPhoto.get();
    },

    loadingBackground() {
        return Template.instance().loadingBackground.get();
    },

    profileOwner() {
        return isProfileOwner();
    },

    photoHoverable() {
        return isProfileOwner() ? 'hoverable' : '';
    },

    profileName() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }

        let profile = user.profile,
            firstName = profile.firstName,
            lastName = profile.lastName;

        if (!firstName || !lastName || !_.isEmpty(firstName.trim()) || !_.isEmpty(lastName.trim()))
            return firstName + ' ' + lastName;
        else
            return 'Unnamed Capybara';
    },
    profileHourlyRate() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.hourlyRate)
            return user.profile.hourlyRate;

    },
    profileAvailabilityTime() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.availabilityTime)
            return user.profile.availabilityTime.toLowerCase();
    },

    profileSkills() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.skills){
            let userSkills = Skills.find({_id: {$in: user.profile.skills}}).fetch();
            let userSkillsValue = _.map(userSkills, function (skill) {
                return skill.label;
            });
            return userSkillsValue;
        }
        else{
            return [];

        }
    },

    profileOverview() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.overview)
            return user.profile.overview;
        else
            return [];
    },

    profileLocation() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile && user.profile.location)
            return user.profile.location.locality + ', ' + user.profile.location.country;

    },

    profileAvailability() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.availability) {
            return 'available';

        }
        else {
            return 'unavailable';
        }
    },
    isOnline() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.online) {
            return 'online'
        }
        return 'offline';
    },
    userStatus() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        return user.profile.online ? 'Online' : user.profile.lastOnline ? 'Last online ' + moment(user.profile.lastOnline).fromNow() :'';
    },
    isLocation() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        return user.profile.location;
    },
    localTime() {
        let timeZoneId = Template.instance().timeZoneName.get();
        return moment.tz(timeZoneId).format('hh:mm a')
    },
    isHired() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        return user.profile.availability;
    },
    prevUser() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        let prevUser = Meteor.users.findOne({createdAt: {$lt: user.createdAt}}, {sort: {createdAt: -1}});
        return prevUser;
    },
    nextUser() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        let nextUser = Meteor.users.findOne({createdAt: {$gt: user.createdAt}}, {sort: {createdAt: 1}});
        return nextUser;
    }
});

function isProfileOwner() {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (user) {
        return Meteor.userId() === user._id;
    }
    return false
}