import { VZ } from '/imports/startup/both/namespace';
import { checkResetPasswordToken } from '/imports/api/users/methods';
import './recover-password.html';

Template.recoverPassword.onCreated(function () {
    let token = this.data.token;
    let self = this;

    checkResetPasswordToken.call({token}, function (err, res) {
        if (err) {
            VZ.notify(err.error);
            self.invalidTokenErrorMessage = err.error;
            setTimeout(function () {
                Router.go('login');
            }, 5000);
        } else if (res) {
            self.isTokenValid = true;
        }
    });
});

Template.recoverPassword.events({
    'submit #resetPasswordForm': function (event, tmpl) {
        event.preventDefault();

        if (!tmpl.isTokenValid) {
            VZ.notify(tmpl.invalidTokenErrorMessage);
            return;
        }

        let password = tmpl.$('#password').val();
        let passwordConfirm = tmpl.$('#passwordConfirm').val();

        let validationResult = VZ.helpers.validatePassword(password);

        if (validationResult.error) {
            VZ.notify(validationResult.msg, 5000);
            return;
        }
        else {
            if (_.isEmpty(passwordConfirm)) {

                VZ.notify('Please confirm your password', 5000);
                return;
            }
            if (password != passwordConfirm) {

                VZ.notify('Passwords don\'t match', 5000);
                return;
            }
            let token = Template.instance().data.token;
            if (!token) {

                VZ.notify('Invalid token. Please contact vezio team', 5000);
            }
            Accounts.resetPassword(token, password, function (err) {
                if (err) {

                    VZ.notify(err.reason, 5000);
                    console.log(err.reason);
                } else {

                    VZ.notify('Your password has been changed.', 5000)
                    Router.go('login');
                }
            });
        }

    },

    'input .input-field #password': function () {
        let $field = $('#password'),
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

    'input .input-field #passwordConfirm': function () {
        let $field = $('#passwordConfirm'),
            $passwordField = $('#password'),
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

