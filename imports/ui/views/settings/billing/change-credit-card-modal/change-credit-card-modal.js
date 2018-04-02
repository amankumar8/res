import { VZ } from '/imports/startup/both/namespace';
import braintree from 'braintree-web/client';
import hostedFields from 'braintree-web/hosted-fields';
import './change-credit-card-modal.html';
import { updatePaymentMethod, getClientToken} from '/imports/api/braintree/methods';

Template.changeCreditCardModal.onCreated(function () {
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
Template.changeCreditCardModal.onRendered(function () {
    this.$('.modal').modal();
    this.$('.modal').modal('open');
    this.$('select').material_select();
    let self = this;
    getClientToken.call(function (err, clientToken) {
        if (err) {
            console.log('There was an error', err);
            return;
        }
        let add = document.querySelector('#add-card');
        // let submit = document.querySelector('input[type="submit"]');

        braintree.create({
            // Replace this with your own authorization.
            authorization: clientToken,
        }, function (clientErr, clientInstance) {
            if (clientErr) {
                return;
            }
            hostedFields.create({
                client: clientInstance,
                styles: {
                    'input': {
                        'font-size': '14pt'
                    },
                    'input.invalid': {
                        'color': 'red'
                    },
                    'input.valid': {
                        'color': 'green'
                    }
                },
                fields: {
                    number: {
                        selector: '#card-number',
                        placeholder: '4111 1111 1111 1111'
                    },
                    cvv: {
                        selector: '#cvv',
                        placeholder: '123'
                    },
                    expirationDate: {
                        selector: '#expiration-date',
                        placeholder: '10/2019'
                    }
                }
            }, function (hostedFieldsErr, hostedFieldsInstance) {
                if (hostedFieldsErr) {
                    return;
                }
                add.addEventListener('click', function (event) {
                    event.preventDefault();

                    hostedFieldsInstance.tokenize(function (tokenizeErr, payload) {
                        if (tokenizeErr) {
                            VZ.notify(tokenizeErr.message.replace('Cannot tokenize invalid card fields.', ''));
                            return;
                        }
                        let payloadnonce = payload.nonce;
                        let selfdatacustomer = self.data.customer;

                        updatePaymentMethod.call({payloadnonce,selfdatacustomer}, (error, result) => {
                            if (!error) {
                                self.data.onCardChange();
                                self.$('#edit-card-modal').modal('close');
                                removeTemplate(self.view);
                            } else {
                                VZ.notify(error.message);
                            }
                        });
                    });
                }, false);
            });
        });
    });


    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
    this.autorun(() => {
        Template.currentData();
    });
});
Template.changeCreditCardModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});
Template.changeCreditCardModal.helpers({
    hasPassword() {
        return Template.instance().hasPassword.get();
    }
});
Template.changeCreditCardModal.events({
    'click .cancel': function (event, tmpl) {
        event.preventDefault();
        tmpl.$('#edit-card-modal').modal('close');
        removeTemplate(tmpl.view);
    }
});
let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};
