import {Companies, CompanySchema} from './companies';
import {VZ} from '/imports/startup/both/namespace';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {uploadPhoto} from '/imports/api/google-services/google-api/methods';
import {sendNotifications} from '/imports/api/notifications/methods';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {fillAssignedUsersMap, changeUserRoles} from '/imports/api/users/helper-functions';
import {companyUserPositions} from '/imports/startup/both/user-positions/company';
import {Contracts} from '/imports/api/contracts/contracts';

export const addCompany = new ValidatedMethod({
  name: 'companies.addCompany',
  validate: CompanySchema.validator(),
  run(document) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('Companies.addCompany.notLoggedIn', 'You should be logged in!');
    }
    if (!document.isPrivate && !checkWhetherCompanyNameIsUnique.call({
        name: document.name,
        country: document.location.country
      })) {
      throw new Meteor.Error('Company with the same name already exist!');
    }
    document.isArchived = false;
    document.ownerId = userId;
    document.createdAt = new Date();
    document = uploadCompanyLogoToGoogleStorage(document);

    let companyId = Companies.insert(document);

    // owner is company admin
    Roles.addUsersToRoles(userId, 'company-owner', companyId);

    let user = Meteor.users.findOne({_id: userId});
    let notificationMsg = 'Company - ' + document.name + ' - added by ' + user.profile.fullName;
    sendNotifications.call({title: "Added new company", msg: notificationMsg, usersIdsArray: userId});

    return companyId;
  }
});

export const editCompany = new ValidatedMethod({
  name: 'companies.editCompany',
  validate: CompanySchema.validator(),
  run(document) {
    const userId = this.userId;
    if (Roles.userIsInRole(userId, ['company-owner', 'company-admin'], document._id)) {
      let documentId = document._id;
      const companyToUpdate = Companies.findOne({_id: documentId});
      if (!companyToUpdate) {
        throw new Meteor.Error('Company is not exist!');
      }
      if (!VZ.canUser('editCompany', userId, companyToUpdate._id)) {
        throw new Meteor.Error('You\'re not allowed to edit this company!');
      }

      if (!document.isPrivate && !checkWhetherCompanyNameIsUnique.call({
          name: document.name,
          country: document.location.country,
          id: documentId
        })) {
        throw new Meteor.Error('Company with the same name already exist!');
      }

      document = uploadCompanyLogoToGoogleStorage(document);

      document = _.omit(document, '_id');

      Companies.update({_id: companyToUpdate._id}, {$set: document}, function (err) {
        if (err) {
          throw new Meteor.Error('Company editing failed');
        }
      });
    }
    else {
      throw new Meteor.Error('Company owner or admin can edit company');
    }
  }
});

export const archiveCompany = new ValidatedMethod({
  name: 'companies.archiveCompany',
  validate: new SimpleSchema({
    id: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({id}) {
    const userId = this.userId;
    if (Roles.userIsInRole(userId, ['company-owner'], id)) {
      const userId = this.userId;
      const companyToArchive = Companies.findOne(id);
      if (!companyToArchive) {
        throw new Meteor.Error('Company is not exist!');
      }
      if (!VZ.canUser('archiveCompany', userId, companyToArchive._id)) {
        throw new Meteor.Error('You\'re not allowed to archive this company!');
      }
      let query = {
        isArchived: true,
        archivedAt: new Date()
      };
      Companies.update({_id: id, ownerId: userId}, {$set: query}, function (err) {
        if (err) {
          throw new Meteor.Error('Company deleting failed ! You must be an owner');
        }
      });
      const ownerId = companyToArchive.ownerId;
      const user = Meteor.users.findOne({_id: ownerId});
      let notificationMsg = "Company - " + companyToArchive.name + " - archived by " + user.profile.fullName;
      sendNotifications.call({title: "Archived company", msg: notificationMsg, usersIdsArray: userId});
    }
    else {
      throw new Meteor.Error('Only company owner can archive company');
    }
  }
});

export const archiveCompanies = new ValidatedMethod({
  name: 'companies.archiveCompanies',
  validate: new SimpleSchema({
    companyIds: {
      type: [String],
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({companyIds}) {
    for (let i = 0; i < companyIds.length; i++) {
      Companies.update({_id: companyIds[i]}, {
        $set: {
          isArchived: true
        }
      });
    }
  }
});

export const restoreCompanies = new ValidatedMethod({
  name: 'companies.restoreCompanies',
  validate: new SimpleSchema({
    companyIds: {
      type: [String],
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({companyIds}) {
    for (let i = 0; i < companyIds.length; i++) {
      Companies.update({_id: companyIds[i]}, {
        $set: {
          isArchived: false

        }
      });
    }
  }
});

export const restoreCompany = new ValidatedMethod({
  name: 'companies.restoreCompany',
  validate: new SimpleSchema({
    companyId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({companyId}) {
    const userId = this.userId;
    if (VZ.canUser('restoreCompany', userId, companyId)) {
      const company = Companies.findOne({_id: companyId});
      Companies.update(companyId, {
        $set: {
          isArchived: false
        }
      });
      const user = Meteor.users.findOne({_id: this.userId});
      let notificationMsg = "Company - " + company.name + " - restored by " + user.profile.fullName + " -";
      sendNotifications.call({title: "Company restored", msg: notificationMsg, usersIdsArray: this.userId});
    } else {
      throw new Meteor.Error('permission-error', 'You can\'t restore this company!');
    }
  }
});

export const verifyCompany = new ValidatedMethod({
  name: 'companies.verifyCompany',
  validate: new SimpleSchema({
    id: {
      type: [String],
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({id}) {
    const userId = this.userId;
    if (userId && VZ.canUser('verifyCompany', userId)) {
      Companies.update({_id: id}, {$set: {verified: 'verified'}});
    }
  }
});

export const updateCompanyLogo = new ValidatedMethod({
  name: 'companies.updateCompanyLogo',
  validate: new SimpleSchema({
    buffer: {type: Uint8Array},
    type: {type: String},
    companyId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({buffer, type, companyId}) {
    if (companyId) {
      let params = {
        name: companyId,
        type: type,
        buffer: buffer,
        bucketName: 'vezio_companies_logo'
      };
      try {
        let mediaLink = uploadPhoto.call(params);
        Companies.update({_id: companyId}, {$set: {'logoUrl': mediaLink}});
      } catch (e) {
        return e;
      }
    }
  }
});

export const checkWhetherCompanyNameIsUnique = new ValidatedMethod({
  name: 'companies.checkWhetherCompanyNameIsUnique',
  validate: new SimpleSchema({
    name: {type: String},
    country: {type: String},
    id: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validator(),
  run({name, country, id}) {
    const query = {name: name, 'location.country': country, _id: {$ne: id}};
    return !Companies.findOne(query);
  }
});

export const assignUsersToCompany = new ValidatedMethod({
  name: 'companies.assignUsersToCompany',
  // validate: new SimpleSchema({
  //     companyId: {
  //         type: String,
  //         regEx: SimpleSchema.RegEx.Id
  //     },
  //     assignedUsersWithPositions: {
  //         type: [String]
  //     },
  //     assignedUsersWithPositionsBeforeChanges: {
  //         type: [String]
  //     }
  // }).validator(),
  validate: null,

  run({companyId, assignedUsersWithPositions, assignedUsersWithPositionsBeforeChanges}) {
    const userId = this.userId;
    let companyToUpdate = Companies.findOne(companyId);

    if (!companyToUpdate) {
      throw new Meteor.Error('Company is not exist!');
    }

    if (!VZ.canUser('assignUserToCompany', userId, companyToUpdate._id)) {
      throw new Meteor.Error('You\'re not allowed to assign users to this company!');
    }

    let availablePositions = companyUserPositions;

    // check whether all changed positions can be updated by current user
    // and update roles after that
    changeUserRoles(companyId, assignedUsersWithPositionsBeforeChanges, assignedUsersWithPositions, availablePositions);

    // If user roles was updated - update company workers list
    let assignedUsersMap = fillAssignedUsersMap(assignedUsersWithPositions, availablePositions);
    Companies.update({_id: companyId}, {$set: assignedUsersMap});
  }
});

export const getCompanyWorkersAndroid = new ValidatedMethod({
  name: 'companies.getCompanyWorkers',
  validate: new SimpleSchema({
    companyId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({companyId}) {
    const company = Companies.findOne({_id: companyId});
    const workersIds = company.workersIds || [];
    let companyWorkers = Meteor.users.find({_id: workersIds}).fetch();
    companyWorkers = _.map(companyWorkers, (companyWorker) => {
      return {_id: companyWorker._id, name: companyWorker.profile.fullName, photo: companyWorker.profile.photo};
    });
    return JSON.stringify(companyWorkers);
  }
});

export const getContractedCompanies = new ValidatedMethod({
  name: 'companies.getContractedCompanies',
  validate: new SimpleSchema({
    userId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validator(),
  run({userId}) {
    const contracts = Contracts.find({workerId: userId, companyId: {$exists: true}}).fetch();
    const contractedCompanies = contracts.map((contract) => {
      return contract.companyId;
    });
    return JSON.stringify(contractedCompanies);
  }
});

const uploadCompanyLogoToGoogleStorage = function (document) {
  if (document.logo) {
    const logoParams = {
      name: document._id,
      buffer: document.logo.buffer,
      type: document.logo.type,
      bucketName: 'vezio_companies_logo'
    };
    document.logoUrl = Meteor.call('uploadPhoto', logoParams);
  }
  delete document.logo;
  return document;
};