import { VZ } from '/imports/startup/both/namespace';
import { updatePaswordChange, removeUser } from '/imports/api/users/methods';

import './general.html';
import './edit-password-modal/edit-password-modal';

Template.generalSettings.helpers({
    passwordUpdated() {
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        return user && user.profile && user.profile.passwordUpdated || user.createdAt;
    }
});
Template.generalSettings.events({
    'click #change-password': function (event, tmpl) {
        event.preventDefault();
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        if (!user || !user.profile) {
            return;
        }
        let profile = user && user.profile;
        let parentNode = $('body')[0],
            onUserEdit = function () {
                updatePaswordChange.call(function (error, result) {
                    if (error) {
                        VZ.notify(error.message);
                    }
                });
            },
            modalData = {
                profile: profile,
                onUserEdit: onUserEdit
            };
        Blaze.renderWithData(Template.editPasswordModal, modalData, parentNode);
    },
    'click #remove-account': function (event, tmpl) {
        event.preventDefault();
        let really = confirm('Are you sure ?');
        if (really) {
            removeUser.call(function (error, result) {
                if (error) {
                    VZ.notify('Error');
                }
                else {
                    VZ.notify('Removed, bye ');
                    Router.go('login');
                }
            });
        }
    }
});