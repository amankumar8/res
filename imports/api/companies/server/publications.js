/**
 * @param {string} params._id - id of the company
 * @param {'private'|'public'|'all'} params.type - type of company
 * @params {object} options - default mongo query options
 */
import {Companies} from '../companies';
import {Meteor} from 'meteor/meteor'
import {publishComposite} from 'meteor/reywood:publish-composite';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {Teams} from '/imports/api/teams/teams';

Meteor.publish('companiesByNameRegExp', function (searchString, limit) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    searchString: {
      type: String,
      optional: true
    },
    limit: {
      type: Number
    }
  }).validate({searchString, limit});

  let searchParams = {isArchived: false};
  let params = {sort: {name: 1}};
  params.limit = limit;

  let companiesCreatedByUser = Roles.getGroupsForUser(userId, 'company-owner');
  let companiesWhereUserAdmin = Roles.getGroupsForUser(userId, 'company-admin');
  let companiesWhereUserManager = Roles.getGroupsForUser(userId, 'company-manager');
  let companiesWhereUserWorker = Roles.getGroupsForUser(userId, 'company-worker');
  let companiesWhereUserObserver = Roles.getGroupsForUser(userId, 'company-observer');

  let relatedCompaniesDirectly = _.union(companiesCreatedByUser,
    companiesWhereUserAdmin, 
    companiesWhereUserManager,
    companiesWhereUserWorker,
    companiesWhereUserObserver);


  if (searchString != '') {
    let searchStringRegExp = new RegExp(searchString, 'ig');
    searchParams.name = {$regex: searchStringRegExp};
  }
  searchParams._id = {$in: relatedCompaniesDirectly};

  return Companies.find(searchParams, params);
});

Meteor.publish('companiesByNameRegExpAlternative', function (searchString, limit, addQuery = {}, addOptions = {}) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    searchString: {
      type: String,
      optional: true
    },
    limit: {
      type: Number
    },
    addQuery: {
      type: Object,
      optional: true
    },
    addOptions: {
      type: Object,
      optional: true
    }
  }).validate({searchString, limit});

  const query = Object.assign({isArchived: false}, addQuery);
  const options = Object.assign({sort: {name: 1}, limit}, addOptions);

  let companiesCreatedByUser = Roles.getGroupsForUser(userId, 'company-owner');
  let companiesWhereUserIsAdmin = Roles.getGroupsForUser(userId, 'company-admin');

  let relatedCompaniesDirectly = _.union(companiesCreatedByUser, companiesWhereUserIsAdmin);


  if (searchString) {
    let searchStringRegExp = new RegExp(searchString, 'ig');
    query.name = {$regex: searchStringRegExp};
  }
  query._id = {$in: relatedCompaniesDirectly};

  return Companies.find(query, options);
});

Meteor.publish('companyById', function (companyId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    companyId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({companyId});
  return Companies.find({_id: companyId});
});

Meteor.publish('companiesForAdmin', function (userId) {
  if (userId === 'wh8or4SeGKKr5WTDs' || this.userId) {
    return Companies.find();
  }
  else {
    return this.ready();
  }
});

Meteor.publish('favoriteCompaniesForUser', function () {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    return Companies.find({addedToFavoriteUsersIds: userId});
});

Meteor.publish('oneCompanyForAdmin', function (id, userId) {
  if (userId === 'wh8or4SeGKKr5WTDs' || this.userId) {
    return Companies.find({_id: id});
  }
  else {
    return this.ready();
  }
});

Meteor.publish('companiesList', function () {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  return Companies.find({workersIds: userId});
});

publishComposite('Companies', function (params, options) {
  var userId = this.userId;
  return {
    find: function () {
      params = params || {};
      options = options || {};

      var companiesCreatedByUser = Roles.getGroupsForUser(userId, 'company-admin');
      var companiesCreatedByUser1 = Roles.getGroupsForUser(userId, 'company-owner');
      var companiesManager = Roles.getGroupsForUser(userId, 'company-manager');
      var assignedCompanies = Roles.getGroupsForUser(userId, 'company-worker');
      var relatedTeamsIds = Roles.getGroupsForUser(userId, 'team-member');

      var relatedCompaniesDirectly = _.union(companiesCreatedByUser, companiesCreatedByUser1, companiesManager, assignedCompanies);

      params.$or = [
        {_id: {$in: relatedCompaniesDirectly}},
        {assignedTeamsIds: {$in: relatedTeamsIds}}
      ];
      return Companies.find(params);
    },
    children: [{
      find: function (company) {
        var userIds = company.workersIds || [];
        userIds.push(company.ownerId);
        return Meteor.users.find({
          _id: {
            $in: userIds
          }
        }, {
          fields: {
            profile: 1,
            roles: 1
          }
        });
      }
    }, {
      find: function (company) {
        return Teams.find({assignedCompanyId: company._id});
      },
      children: [{
        find: function (team) {
          var userIds = team.membersIds || [];
          userIds.push(team.ownerId);
          return Meteor.users.find({
            _id: {
              $in: userIds
            }
          }, {
            fields: {
              profile: 1,
              roles: 1
            }
          });
        }
      }
      ]
    }]
  }
});