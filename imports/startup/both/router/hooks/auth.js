import { VZ } from '/imports/startup/both/namespace';

let routesForUnloggedUsers = [
    'login',
    'index',
    'email-confirmation',
    'profile-not-activated',
    'verify-email',
    'recover-password',
    'account-closed',
    'reset-db',
    'videoShare',
];

let isLoggedIn = function () {
    let user = Meteor.user();
    let emailVerified;
    if (user && !Meteor.loggingIn()) {
        emailVerified = VZ.helpers.isEmailVerified(user);
    }
    if (!user && !Meteor.loggingIn() && Router.current().route.getName() !== 'login-old') {
        Router.go('login');
    }
    else if(Router.current().route.getName() === 'login-old') {
        this.next();
    }
    else if (!emailVerified && !Meteor.loggingIn()) {
        Router.go('profile-not-activated')
    }
    else if (user && user.status === 'closed') {
        Accounts.logout();
        Router.go('account-closed');
    }
    else {
        this.next();
    }
};

Router.onBeforeAction(isLoggedIn, {
    except: routesForUnloggedUsers
});
