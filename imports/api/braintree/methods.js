import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/underscore';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

let gateway;

Meteor.startup(function () {
    if (Meteor.isServer) {
        import braintree from 'braintree';
        gateway = braintree.connect({
            environment: braintree.Environment.Sandbox,
            publicKey: Meteor.settings.private.BT_PUBLIC_KEY,
            privateKey: Meteor.settings.private.BT_PRIVATE_KEY,
            merchantId: Meteor.settings.private.BT_MERCHANT_ID
        });
    }
});

export const createPaymentMethod = new ValidatedMethod({
    name: 'braintree.createPaymentMethod',
    validate: null,
    run({nonceFromTheClient}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('createPaymentMethod.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let customer = Meteor.wrapAsync(gateway.paymentMethod.create, gateway.paymentMethod);
            let response = customer({
                customerId: userId,
                paymentMethodNonce: nonceFromTheClient,
                options: {
                    verifyCard: true,
                    makeDefault: true
                }
            });
        }
    }
});

export const updatePaymentMethod = new ValidatedMethod({
    name: 'braintree.updatePaymentMethod',
    validate: null,
    run({nonceFromTheClient, customerInfo}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('updatePaymentMethod.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let paymentMethod = customerInfo && customerInfo.paymentMethods && customerInfo.paymentMethods[0] && customerInfo.paymentMethods[0].token;
            if (paymentMethod) {
                let customer = Meteor.wrapAsync(gateway.paymentMethod.update, gateway.paymentMethod);
                let response = customer(paymentMethod, {
                    customerId: userId,
                    paymentMethodNonce: nonceFromTheClient,
                    options: {
                        verifyCard: true,
                        makeDefault: true
                    }
                });
                return response;
            }
            else {
                createPaymentMethod.call({nonceFromTheClient});
            }
        }
    }
});

export const deletePaymentMethod = new ValidatedMethod({
    name: 'braintree.deletePaymentMethod',
    validate: null,
    run({token}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('deletePaymentMethod.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let customer = Meteor.wrapAsync(gateway.paymentMethod.delete, gateway.paymentMethod);
            let response = customer(token);
            Meteor.users.update({_id: userId}, {$pull: {'profile.billing.paymentMethods': token}});
            return response;
        }
    }
});

export const subscribeToPlan = new ValidatedMethod({
    name: 'braintree.subscribeToPlan',
    validate: new SimpleSchema({
        token: {
            type: String
        },
        maskedNumber: {type: String},
    }).validator(),
    run({token, maskedNumber}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('subscribeToPlan.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let subscriptionId = Meteor.wrapAsync(gateway.subscription.create, gateway.subscription);
            let response = subscriptionId({
                paymentMethodToken: token,
                planId: 'vezio-pro'
            });
            let paymentMethod = token;
            let id = response.subscription.id;
            let isActive = response.subscription.status;
            let nextBillingDate = response.subscription.nextBillingDate;
            let subscription = {
                id: id,
                isActive: isActive,
                nextBillingDate: nextBillingDate,
                planId: 'vezio-pro',
                paymentMethod: paymentMethod,
                maskedNumber: maskedNumber

            };
            Meteor.users.update({_id: this.userId}, {$addToSet: {'profile.billing.subscriptions': subscription}});
            return response;
        }
    }
});

export const unSubscribeToPlan = new ValidatedMethod({
    name: 'braintree.unSubscribeToPlan',
    validate: new SimpleSchema({
        subscribtionId: {
            type: String,
        }
    }).validator(),
    run({subscribtionId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('unSubscribeToPlan.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let subscription = Meteor.wrapAsync(gateway.subscription.cancel, gateway.subscription);
            let response = subscription(subscribtionId);

            Meteor.users.update({_id: this.userId}, {$pull: {'profile.billing.subscriptions': {id: subscribtionId}}});
            return response;
        }
    }
});

export const changeSubPaymentMethod = new ValidatedMethod({
    name: 'braintree.changeSubPaymentMethod',
    validate: null,
    run({subscriptionId, paymentMethodToken, maskedNumber}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('changeSubPaymentMethod.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {

            let user = Meteor.users.findOne({_id: userId});
            let subscriptions = user.profile.billing.subscriptions;
            for (let i = 0; i < subscribtions.length; i++) {
                if (subscriptions[i].id === subscriptionId) {
                    subscriptions[i].paymentMethod = paymentMethodToken;
                    subscriptions[i].maskedNumber = maskedNumber;
                }
            }
            let subscription = Meteor.wrapAsync(gateway.subscription.update, gateway.subscription);
            let response = subscription(subscriptionId, {
                paymentMethodToken: paymentMethodToken
            });
            Meteor.users.update({
                _id: this.userId,
                'profile.billing.subscriptions': {$elemMatch: {id: subscriptionId}}
            }, {$set: {'profile.billing.subscriptions': subscribtions}});
            return response;
        }
    }
});

export const getClientToken = new ValidatedMethod({
    name: 'braintree.getClientToken',
    validate: null,
    run({clientId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('getClientToken.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let generateToken = Meteor.wrapAsync(gateway.clientToken.generate, gateway.clientToken);
            let options = {};
            if (clientId) {
                options.clientId = clientId;
            }
            let response = generateToken(options);
            return response.clientToken;
        }
    }
});

export const createTransaction = new ValidatedMethod({
    name: 'braintree.createTransaction',
    validate: null,
    run(data) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('createTransaction.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let transaction = Meteor.wrapAsync(gateway.transaction.sale, gateway.transaction);
            // this is very naive, do not do this in production!
            let amount = 20;
            let response = transaction({
                amount: amount,
                paymentMethodNonce: data.nonce,
                customer: {
                    firstName: data.firstName
                }
            });
            return response;
        }
    }
});

export const createCustomer = new ValidatedMethod({
    name: 'braintree.createCustomer',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('createCustomer.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let user = Meteor.users.findOne({_id: this.userId});
            if (user && !user.profile.billing) {
                let customer = Meteor.wrapAsync(gateway.customer.create, gateway.customer);
                let response = customer({
                    firstName: user.profile.firstName,
                    lastName: user.profile.lastName,
                    email: user.emails[0].address,
                });
                Meteor.users.update({_id: this.userId}, {$set: {'profile.billing.customerId': response.customer.id}});
                return response;
            }
        }
    }
});

export const checkIfCustomer = new ValidatedMethod({
    name: 'braintree.checkIfCustomer',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('checkIfCustomer.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let responseCustomer;
            let user = Meteor.users.findOne({_id: this.userId});
            let customer = Meteor.wrapAsync(gateway.customer.find, gateway.customer);
            let newCustomer = Meteor.wrapAsync(gateway.customer.create, gateway.customer);
            try {
                customer(userId);
            }
            catch (err) {
                if (err.name == 'notFoundError') {
                    responseCustomer = newCustomer({
                        id: userId,
                        firstName: user.profile.firstName,
                        lastName: user.profile.lastName,
                        email: user.emails[0].address,
                    });
                }
            }
            return responseCustomer;
        }
    }
});

export const deleteCustomer = new ValidatedMethod({
    name: 'braintree.deleteCustomer',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('deleteCustomer.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let customer = Meteor.wrapAsync(gateway.customer.delete, gateway.customer);
            let response = customer('55425400');
            return response;
        }
    }
});

export const updateCustomer = new ValidatedMethod({
    name: 'braintree.updateCustomer',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('updateCustomer.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let customer = Meteor.wrapAsync(gateway.customer.update, gateway.customer);
            let response = customer('55425400');
            return response;
        }
    }
});

export const getCustomerInfo = new ValidatedMethod({
    name: 'braintree.getCustomerInfo',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('getCustomerInfo.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let customer = Meteor.wrapAsync(gateway.customer.find, gateway.customer);
            let response = customer(userId);
            return response;
        }
    }
});

export const findTransactions = new ValidatedMethod({
    name: 'braintree.findTransactions',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('findTransactions.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let transactions = Meteor.wrapAsync(gateway.transaction.search, gateway.transaction);
            let searchFunction = function (search) {
                search.customerId().is(userId);
            };
            let iterateFunction = function (err, response) {
                response.each(function (err, transaction) {
                    // Session.set('transaction', transaction);
                    console.log(transaction.amount);
                });
            };
            let stream = transactions(searchFunction);
            let completeData = "";
            stream.on("data", function (chunk) {
                completeData += JSON.stringify(chunk);
            });
            stream.on("end", function () {
                // console.log(completeData);
            });

            // stream.resume();
            return [];
        }
    }
});

export const findPaymentMethods = new ValidatedMethod({
    name: 'braintree.findPaymentMethods',
    validate: null,
    run({paymentMethods}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('findPaymentMethods.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let methods = [];
            for (let i = 0; i < paymentMethods.length; i++) {
                let customer = Meteor.wrapAsync(gateway.paymentMethod.find, gateway.paymentMethod);
                let response = customer(paymentMethods[i]);
                methods.push(response);
            }
            return methods;
        }
    }
});

export const findPaymentMethod = new ValidatedMethod({
    name: 'braintree.findPaymentMethod',
    validate: null,
    run({token}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('findPaymentMethod.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let customer = Meteor.wrapAsync(gateway.paymentMethod.find, gateway.paymentMethod);
            let response = customer(token);
            return response;
        }
    }
});

export const getPlans = new ValidatedMethod({
    name: 'braintree.getPlans',
    validate: null,
    run() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('getPlans.notLoggedIn',
                'Have to login to do this!');
        }
        if (Meteor.isServer) {
            let plan = Meteor.wrapAsync(gateway.plan.all, gateway.plan);
            let response = plan();
            return response;
        }
    }
});