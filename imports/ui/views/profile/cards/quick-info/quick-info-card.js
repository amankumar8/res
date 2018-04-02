import { VZ } from '/imports/startup/both/namespace';
import { updateProfileMedia } from '/imports/api/users/methods';

import './quick-info-card.html';

Template.quickInfoCard.onCreated(function () {
    this.getSocialIconName = function (socialName) {
        switch (socialName) {
            case 'Facebook':
                return 'fa fa-facebook';
            case 'Twitter':
                return 'fa fa-twitter';
            case 'Google+':
                return 'fa fa-google-plus';
            case 'Pinterest':
                return 'fa fa-pinterest';
            case 'LinkedIn':
                return 'fa fa-linkedin';
        }
    };

    this.getSocialName = function (socialName) {
        switch (socialName) {
            case 'Facebook':
                return 'facebook';
            case 'Twitter':
                return 'twitter';
            case 'Google+':
                return 'gplus';
            case 'Pinterest':
                return 'pinterest';
            case 'LinkedIn':
                return 'linkedin';
        }
    };
});

Template.quickInfoCard.onRendered(function () {
});

Template.quickInfoCard.helpers({
    profileOwner() {
        return isProfileOwner();
    },
    socialIcon(socialName) {
        return Template.instance().getSocialIconName(socialName);
    },
    socialName(socialName) {
        return Template.instance().getSocialName(socialName);
    },
    profileLanguages() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.languages)
            return user.profile.languages.toString().replace(/,/g, ', ');
        else
            return [];
    },
    personalWebsite() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.personalWebsite) {
            return user.profile.personalWebsite;
        }
    },
    formatWebsite(link) {
        return link ? link.replace('https://', '').trim() : '';
    },
    profileSocial() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.socialMedias)
            return user.profile.socialMedias;
        else
            return [];
    }
});

Template.quickInfoCard.events({
    'click .edit-icon': function (event, tmpl) {
        event.preventDefault();
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        if (!user || !user.profile) {
            return;
        }
        let getSocialIconName = tmpl.getSocialIconName;
        let profile = user && user.profile;
        let parentNode = $('body')[0],
            onUserEdit = function (user) {
                updateProfileMedia.call(user, function (error, result) {
                    if (!error) {
                        VZ.notify('Success');
                    }
                    else {
                        VZ.notify(error.message);
                    }
                });
            },
            modalData = {
                profile: profile,
                onUserEdit: onUserEdit,
                getSocialIconName: getSocialIconName
            };
        Blaze.renderWithData(Template.editQuickInfoModal, modalData, parentNode);
    }
});

function isProfileOwner() {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (user) {
        return Meteor.userId() === user._id;
    }
    return false
}