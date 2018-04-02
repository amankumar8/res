import { VZ } from '/imports/startup/both/namespace';
import { BankCredentials } from '/imports/api/bankCredentials/bankCredentials';
import './billing.html';
import './change-credit-card-modal/change-credit-card-modal';
import './create-edit-bank-credentials-modal/create-edit-credentials-modal';
import './invoices-modal/invoices-modal';
import { subscribeToPlan, unSubscribeToPlan, getPlans, getCustomerInfo, checkIfCustomer, findTransactions } from '/imports/api/braintree/methods';

Template.billingSettings.onCreated(function () {
    let self = this;
    this.customerInfo = new ReactiveVar({});
    this.plans = new ReactiveVar({});
    this.transactions = new ReactiveVar([]);

    checkIfCustomer.call(function (error, result) {
        if (error) {
            VZ.notify(error.message);
        }
    });


    this.updateCustomerInfo = function () {
        getCustomerInfo.call(function (error, result) {
            if (!error) {
                self.customerInfo.set(result);
            }
            else {
                VZ.notify(error.message);
            }
        });
    };
    this.getPlans = function () {
        getPlans.call(function (error, result) {
            if(!error){
                self.plans.set(result);
            }
            else {
                VZ.notify(error.message);
            }
        });
    };
    this.findTransactions = function () {
        console.log('qwe');

        findTransactions.call(function (error, result) {
            if (!error) {
                console.log(result);
            }
            else {
                VZ.notify(error.message);
            }
        });
    };
    this.autorun(() => {
        this.updateCustomerInfo();
        this.getPlans();
    });
    this.autorun(() => {
        Template.currentData();
        this.subscribe('userBankCredentials');
    });
});
Template.billingSettings.onRendered(function () {

});

Template.billingSettings.helpers({
    customer() {
        let customer = Template.instance().customerInfo.get();
        return customer ;
    },
    isSubscribed() {
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        let subscription = user && user.profile && user.profile.billing && user.profile.billing.subscriptions && user.profile.billing.subscriptions[0] && user.profile.billing.subscriptions[0].id;
        return subscription;
    },
    last4() {
        let last4 = this && this.paymentMethods && this.paymentMethods[0] && this.paymentMethods[0].last4;
        return last4;
    },
    isPaymentMethod() {
        let customer = Template.instance().customerInfo.get();
        return customer && customer.paymentMethods && customer.paymentMethods[0];
    }
});
Template.billingSettings.events({
    'click #change-card': function (event, tmpl) {
        event.preventDefault();
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        if (!user || !user.profile) {
            return;
        }

        let customer = tmpl.customerInfo.get();
        let parentNode = $('body')[0],
            onCardChange = function (user) {
                tmpl.updateCustomerInfo();
            },
            modalData = {
                customer: customer,
                onCardChange: onCardChange
            };
        Blaze.renderWithData(Template.changeCreditCardModal, modalData, parentNode);
    },
    'click #upgrade-to-plan': function (event, tmpl) {
        event.preventDefault();
        let customerInfo = tmpl.customerInfo.get();
        let paymentMethod = customerInfo && customerInfo.paymentMethods && customerInfo.paymentMethods[0];
        if(paymentMethod){
            let token = paymentMethod.token;
            let maskedNumber = paymentMethod.maskedNumber;
            subscribeToPlan.call({token, maskedNumber}, (error, result) => {
                if (result){
                    VZ.notify('Subscription successful');
                }
                else {
                    VZ.notify(error.message);
                }
            });
        }
        else {
            VZ.notify('Add card');
        }
    },
    'click #downgrade-to-plan': function (event, tmpl) {
        event.preventDefault();
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        const planId = 'vezio-pro';
        let subscribtion =  _.find(user.profile.billing.subscriptions, function(subscription){return subscription.planId == planId; });
        let subscribtionId = subscribtion.id;
        if(subscribtionId){
            unSubscribeToPlan.call({subscribtionId}, (error, result) => {
                if(!error){
                    VZ.notify('Unsubscribed');
                    tmpl.updateCustomerInfo();
                    tmpl.getPlans();
                }
                else {
                    VZ.notify(error.message);
                }
            });
        }
    },
    'click #generate-invoice': function (event, tmpl) {
        event.preventDefault();
        let parentNode = $('body')[0],
            modalData = {};
        Blaze.renderWithData(Template.invoicesModal, modalData, parentNode);
    },
    'click #add-credentials': function (event, tmpl) {
        event.preventDefault();
        let bankCredentials = BankCredentials.findOne({userId: Meteor.userId()});
        let parentNode = $('body')[0],
            modalData = {bankCredentials: bankCredentials};
        Blaze.renderWithData(Template.createEditCredentialsModal, modalData, parentNode);
    }
});