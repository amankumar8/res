import { VZ } from '/imports/startup/both/namespace';
import { setPassword } from '/imports/api/users/methods';

import './edit-password-modal.html';

Template.editPasswordModal.onCreated(function () {
    let self = this;
    this.hasPassword = new ReactiveVar(true);

    this.autorun(() => {
        Template.currentData();
    });

    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function(e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
});
Template.editPasswordModal.onRendered(function () {
    let self = this;
    this.$('#edit-password-modal').modal();
    this.$('#edit-password-modal').modal('open');

    this.$('select').material_select();


    this.autorun(() => {
        Template.currentData();
    });

    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function(e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
});
Template.editPasswordModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});
Template.editPasswordModal.helpers({
    hasPassword() {
        return Template.instance().hasPassword.get();
    }
});
Template.editPasswordModal.events({
    'submit #changePasswordForm': function (event, tmpl) {
        event.preventDefault();
        let hasPassword = tmpl.hasPassword.get();
        if(hasPassword){
            let changePasswordForm = $(event.currentTarget),
            oldPassword = changePasswordForm.find('#oldPassword').val(),
            newPassword = changePasswordForm.find('#password').val(),
            passwordConfirm = changePasswordForm.find('#confirmPassword').val();


        if (_.isEmpty(passwordConfirm) || _.isEmpty(newPassword) || _.isEmpty(oldPassword)) {
            VZ.notify('Password may not be empty', 5000);
            return;
        }

        let validationResult = VZ.helpers.validatePassword(newPassword);

        if (validationResult.error) {
            VZ.notify(validationResult.msg, 5000);
            return;
        }

        if (oldPassword === newPassword) {
            VZ.notify('New password must not be same as existing password', 5000);
            return;
        }

        if (newPassword != passwordConfirm) {
            VZ.notify("Passwords don't match'", 5000);
            return;
        }

        Accounts.changePassword(oldPassword, newPassword, function (err) {
            if (err) {
            if(err.reason == 'Incorrect password'){
                VZ.notify('Incorrect password old password', 5000);
            }
            else if(err.reason == 'User has no password set'){
                VZ.notify(err.reason, 5000);
                tmpl.hasPassword.set(false);
            }
            else {
                VZ.notify(err.reason, 5000);
                console.log(err.reason);
            }

            }
            else {

                VZ.notify('Your password has been changed.', 5000);
                console.log(tmpl);
                tmpl.data.onUserEdit();
                tmpl.$('#edit-password-modal').modal('close');
                removeTemplate(tmpl.view);
                // Router.go('profile');
            }
        });
        }
        else {
            let changePasswordForm = $(event.currentTarget),
                newPassword = changePasswordForm.find('#password').val(),
                passwordConfirm = changePasswordForm.find('#confirmPassword').val();

            if (_.isEmpty(passwordConfirm) || _.isEmpty(newPassword)) {

                VZ.notify('Password may not be empty', 5000);
                return;
            }

            let validationResult = VZ.helpers.validatePassword(newPassword);

            if (validationResult.error) {

                VZ.notify(validationResult.msg, 5000);
                return;
            }

            if (newPassword != passwordConfirm) {

                VZ.notify("Passwords don't match'", 5000);
                return;
            }

            setPassword.call({password: newPassword}, function (error, result) {
                if (error) {
                        VZ.notify(error.reason, 5000);
                        console.log(error.reason);
                }
                else {
                    VZ.notify('Your password has been set.', 5000);
                    console.log(tmpl);
                    tmpl.data.onUserEdit();
                    tmpl.$('#edit-password-modal').modal('close');
                    removeTemplate(tmpl.view);
                }
            });

        }
    },

    'input .input-field #password': function (event, tmpl) {
        let $field = tmpl.$('#password'),
            password = $field.val(),
            validationResult = VZ.helpers.validatePassword(password);

        if (validationResult.error) {
            let $label = $field.closest('.input-field').find('label');
            $label.attr('data-error', validationResult.msg);

            $field.addClass('invalid');
            $field.removeClass('valid');
        }
        else {
            $field.addClass('valid');
            $field.removeClass('invalid');
        }
    },

    'input .input-field #confirmPassword': function (event, tmpl) {
        let $field = tmpl.$('#confirmPassword'),
            $passwordField = tmpl.$('#password'),
            password = $passwordField.val(),
            confirmPassword = $field.val(),
            validationResult = VZ.helpers.matchPasswords(password, confirmPassword);

        if (validationResult.error) {
            let $label = $field.closest('.input-field').find('label');
            $label.attr('data-error', validationResult.msg);

            $field.addClass('invalid');
            $field.removeClass('valid');
        }
        else {
            $field.addClass('valid');
            $field.removeClass('invalid');
        }
    }
});
let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};
