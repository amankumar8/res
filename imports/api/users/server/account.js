import { VZ } from '/imports/startup/both/namespace';
import { Schemas } from '/imports/api/users/assigned-users';
import { setTimeLogout } from '/imports/api/users/methods';
import {ServiceConfiguration} from 'meteor/service-configuration';
import { Accounts } from 'meteor/accounts-base';
import { HTTP } from 'meteor/http';
import { _ } from 'meteor/underscore';


Meteor.startup(function () {
  configConfirmMailService();
  stopTrackingOnLogout();
  configResetPasswordService();
});

function stopTrackingOnLogout() {
  if (Meteor.isServer) {
    Meteor.users.find({'status.online': true }).observe({
      removed: function(user) {
        setTimeLogout.call(user);
      }
    });
    UserStatus.events.on('connectionLogout', function (fields) {
    });
  }
}

function configConfirmMailService() {

  Accounts.emailTemplates.from = 'Vezio Notification <' + Meteor.settings.mandrill.sender.email + '>';
  Accounts.emailTemplates.siteName = 'Vezio';
  Accounts.emailTemplates.verifyEmail.subject = confirmEmailSubject;
  Accounts.emailTemplates.verifyEmail.html = renderMandrillTemplate;


  function confirmEmailSubject() {
    return 'Confirm Your Email Address for vezio';
  }

  function renderMandrillTemplate(user, url) {
    let name = '';
    let result;

    if (user.profile && user.profile.firstName)
      name = user.profile.firstName;

    // need to replace # from standart meteor accounts link because we use custom route for email verification
    let link = url.replace('#/', '');
    try {
      result = Mandrill.templates.render({
        template_name: 'verify-email',
        template_content: [],
        merge_vars: [{
          name: 'LINK',
          content: link
        }, {
          name: 'NAME',
          content: name
        }]

      });
    } catch (error) {
      console.error('Error while rendering Mandrill template', error);
    }
    return result.data.html;
  }

  if (VZ.helpers.isDev()) {

    Accounts.config({

      sendVerificationEmail: false

    });
  }
  else {

    Accounts.config({

      sendVerificationEmail: true

    });
  }
}

function configResetPasswordService() {

  Accounts.emailTemplates.resetPassword.subject = resetPasswordSubject;
  Accounts.emailTemplates.resetPassword.html = renderMandrillTemplate;


  function resetPasswordSubject() {
    return 'vezio - Account password change';
  }

  function renderMandrillTemplate(user, url) {
    let name = '';
    let result;

    if (user.profile && user.profile.firstName)
      name = user.profile.firstName;

    // need to replace # from standart meteor accounts link because we use custom route for email verification
    let tokenRegExp = /reset-password\/(.+)/g;
    let token = tokenRegExp.exec(url)[1];
    let link = Router.url('recover-password', {token: token});
    try {
      result = Mandrill.templates.render({
        template_name: 'forgot-password',
        template_content: [],
        merge_vars: [{
          name: 'LINK',
          content: link
        }, {
          name: 'NAME',
          content: name
        }]

      });
    } catch (error) {
      console.error('Error while rendering Mandrill template', error);
    }
    return result.data.html;
  }
}


Accounts.onCreateUser(function (options, user) {
  if (user.services.google) {
    console.log('sign up with google');

    let rawProfile = user.services.google;

    user.emails = [{
      address: user.services.google.email,
      verified: true
    }];
    user.profile = {
      fullName: rawProfile.name || '',
      firstName: rawProfile.given_name || '',
      lastName: rawProfile.family_name || '',
      gender: rawProfile.gender || '',
      isArchived: false,
      isBlocked: false
    };

    let photoUrl = rawProfile.picture || '/images/default-lockout.png';
    user.profile.photo = {
      large: photoUrl,
      small: photoUrl
    }

  } else if (user.services.password) {
    console.log('sign up with pass');
    user.profile = options.profile || {};
  }

  check(user, Schemas.User);
  return user;
});

//googleLogin For Mobile ReactNative(DDP)
Accounts.registerLoginHandler('google', function(params) {

  const data = params.google;
  // If this isn't facebook login then we don't care about it. No need to proceed.
  if (!data) {
    return undefined;
  }
  if(!data.email){
    throw new Meteor.Error(405, 'Unable to Login Email not Verified');
  }
  let picture = data.photo || '/images/default-lockout.png';
  data['picture'] = picture;
  data['given_name'] = data.givenName;
  data['family_name'] = data.familyName;
  delete data['photo'];
  delete data['givenName'];
  delete data['familyName'];

  let userId;
  // Search for an existing user with that google id
  let user = Meteor.users.findOne({"services.google.id": data.id}) ||
    Meteor.users.findOne({"emails.0.address": data.email});
  //existing user
  if (user) {
    console.log('log in with google');
    userId = user._id;
    //existing user
    //update google details
    let a = Meteor.users.update({
      _id: userId
    }, {
      $set: {
        "services.google": data,
        "profile.fullName": data.name || '',
        "profile.firstName": data.given_name || '',
        "profile.lastName": data.family_name || '',
        "profile.photo": {
          large: picture,
          small: picture
        },
        emails: [{
          address: data.email,
          verified: true
        }]
      }
    });
  } else {
    console.log('sign up with google');
    //create user
    userId = Meteor.users.insert({
      services: {
        google: data
      },
      emails: [{
        address: data.email,
        verified: true
      }],
      profile: {
        fullName: data.name || '',
        firstName: data.given_name || '',
        lastName: data.family_name || '',
        gender: data.gender || '',
        isArchived: false,
        isBlocked: false,
        photo: {
          large: picture,
          small: picture
        }
      }
    });
  }
  return { userId };
});
// add default role
Meteor.users.after.insert(function (userId, user) {
  Roles.addUsersToRoles(user._id, 'user', Roles.GLOBAL_GROUP);
});