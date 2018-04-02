import { VZ } from '/imports/startup/both/namespace';
import './create-edit-credentials-modal.html';
import {addBankAccount ,updateBankAccount} from '/imports/api/bankCredentials/methods';
const cc = require('currency-codes');
const IBAN = require('iban');

Template.createEditCredentialsModal.onCreated(function () {
});

Template.createEditCredentialsModal.onRendered(function () {
    let self = this;
    this.$('.modal').modal();
    this.$('.modal').modal('open');
    this.$('select').material_select();

    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
});
Template.createEditCredentialsModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.createEditCredentialsModal.helpers({
    currencyCodes() {
        return cc.codes();
    },
    isResipient(resipient) {
        if (this.bankCredentials && this.bankCredentials.receiverType) {
            let receiverType = this.bankCredentials.receiverType;

            if (receiverType === resipient) {
                return 'checked';
            }
            else {
                return '';
            }
        }
        else {
            return '';
        }
    }
});

Template.createEditCredentialsModal.events({
    'click .save': function (event, tmpl) {
        event.preventDefault();
        let holderName = tmpl.$('#holder-name').val();
        let receiverType = tmpl.$('[name="resipient-type1"]:checked').prop('id');
        let targetCurrency = tmpl.$('#currency-code option:selected').val();
        let addressFirstLine = tmpl.$('#address-first-line').val();
        let addressPostCode = tmpl.$('#address-post-code').val();
        let addressCity = tmpl.$('#address-city').val();
        let addressState = tmpl.$('#address-state').val();
        let addressCountryCode = tmpl.$('#address-country-code').val();
        let abartn = tmpl.$('#abartn').val();
        let accountNumber = tmpl.$('#account-number').val();


        let bankData = {
            name: holderName,
            receiverType: receiverType,
            targetCurrency: targetCurrency,
            addressFirstLine: addressFirstLine,
            addressPostCode: addressPostCode,
            addressCity: addressCity,
            addressState: addressState,
            addressCountryCode: addressCountryCode,
            abartn: abartn,
            accountNumber: accountNumber
        };

        if (tmpl.data && tmpl.data.bankCredentials) {
            bankData._id = tmpl.data.bankCredentials._id;

            updateBankAccount.call(bankData,(error) => {
                if (!error) {
                    VZ.notify('Updated');
                    tmpl.$('#add-credentials-modal').modal('close');
                    removeTemplate(tmpl.view);
                }
                else {
                    VZ.notify(error.message);
                }
            });
        }
        else {
            addBankAccount.call(bankData, (error, result) => {
                if (result) {
                    VZ.notify('Account added');
                    tmpl.$('#add-credentials-modal').modal('close');
                    removeTemplate(tmpl.view);
                }
                else {
                    VZ.notify(error.message);
                }
            });
        }
    },
    'click .cancel': function (event, tmpl) {
        event.preventDefault();
        tmpl.$('#add-credentials-modal').modal('close');
        removeTemplate(tmpl.view);
    }
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};