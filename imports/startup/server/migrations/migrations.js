import {Meteor} from 'meteor/meteor';
import {Migrations} from 'meteor/percolate:migrations';
import {Companies} from '/imports/api/companies/companies';
import {getFileMediaLink} from '/imports/api/google-services/google-api/methods';

Meteor.startup(() => {
  // Migrations.migrateTo('latest');
});

Migrations.add({
  version: 1,
  name: 'Adding fullName field to user',
  up: function () {
    let users = Meteor.users.find().fetch();
    for (let i = 0; i < users.length; i++) {
      if (!users[i].profile.fullName) {
        let firstName = users[i].profile.firstName;
        let lastName = users[i].profile.lastName;
        if (firstName && lastName) {
          let fullName = firstName + ' ' + lastName;
          Meteor.users.update({_id: users[i]._id}, {$set: {'profile.fullName': fullName}});
        }
      }
    }
  },
  down: function () {
    doMigrationIfSchemasIsDisabled(function () {
      Meteor.users.update({}, {$unset: {'profile.fullName': ''}}, {upsert: true})
    });
  }
});

let updateCompaniesLogo = () => {
  let companies = Companies.find({logoUrl: {$exists: true}, $where: 'this.logoUrl.length>0'}, {
    fields: {
      _id: 1,
      logoUrl: 1
    }
  }).fetch();
  companies.forEach((company) => {
    let logoUrl = company.logoUrl;
    let str = logoUrl.split('/o/');
    let bucketStr = str[0];
    let fileNameStr = str[1];

    let bucketName = bucketStr.replace("https://www.googleapis.com/download/storage/v1/b/", '');
    let fileNameArray = fileNameStr.split('?');
    let fileName = fileNameArray[0];
    let mediaLink = getFileMediaLink.call({bucketName, fileName});
    Companies.update({_id: company._id}, {$set: {logoUrl: mediaLink}});
  });
};

let doMigrationIfSchemasIsDisabled = function (migrationFn) {
  if (Meteor.settings.dontUseSchema) {
    migrationFn();
  } else {
    let errorMessage = 'Run meteor without schemas when do migration!';
    console.log(errorMessage);
    throw new Meteor.Error(errorMessage);
  }
};