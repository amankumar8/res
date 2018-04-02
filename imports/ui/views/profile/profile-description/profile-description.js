import { VZ } from '/imports/startup/both/namespace';
import { editDescription } from '/imports/api/users/methods';

import './profile-description.html';

Template.profileDescription.onCreated(function () {
    this.editDescription = new ReactiveVar(false);
});

Template.profileDescription.helpers({
    editDescription() {
        return Template.instance().editDescription.get()
    },
    description() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        return user.profile.description;
    },
    profileDescription() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }

        let profile = user.profile,
            description = profile.description;

        if (_.isEmpty(description)) {
            description = 'Tell us about you'
        }
        return description;
    },
    profileOwner() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (user) {
            return Meteor.userId() === user._id;
        }
        return false
    }
});

Template.profileDescription.events({
    'click .edit-desc': function (event, tmpl) {
        tmpl.editDescription.set(!tmpl.editDescription.get());
    },

    'input #editDescription': function (event, tmpl) {
        let editDesc = tmpl.$('#editDescription'),
            maxLength = 300;
        if (editDesc.val().length > maxLength) {
            let $label = editDesc.closest('.input-field').find('label');
            $label.attr('data-error', 'Description should be less then 300 symbols');
        }
    },

    'submit #editDescriptionForm': function (event, tmpl) {
        event.preventDefault();
        let editDesc = tmpl.$('#editDescription'),
            maxLength = 300;

        if (editDesc.val().length > maxLength) {
            $('.toast').hide();
            VZ.notify('Description should be less then 300 symbols', 5000);
            return;
        }

        editDescription.call({description: editDesc.val()}, function (err) {
            if (err) {
                VZ.notify(err, 5000);
            }
        });

        tmpl.editDescription.set(false);
    }
});