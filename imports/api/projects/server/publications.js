import {Projects} from '../projects';
import {Contracts} from '/imports/api/contracts/contracts';
import {ActivityMessages} from '/imports/api/activityMessages/activityMessages';
import {Teams} from '/imports/api/teams/teams';
import {publishComposite} from 'meteor/reywood:publish-composite';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

publishComposite('assignUsersToProject', function (id) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    id: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({id});

  let query = {_id: id, archived: false};
  let user = Meteor.users.findOne({_id: userId});
  let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
  if (selectedCompanyId) {
    query.companyId = selectedCompanyId;
  }
  return {
    find: function () {
      return Projects.find(query);
    },
    children: [
      {
        find: function (project) {
          let query = {projectIds: project._id, status: {$in: ['active', 'paused']}};
          if (selectedCompanyId) {
            query.companyId = selectedCompanyId;
          }
          return Contracts.find(query);
        },
        children: [
          {
            find: function (contract, project) {
              return Meteor.users.find({_id: contract.workerId}, {
                fields: {profile: 1, roles: 1, emails: 1}
              });
            }
          }
        ]
      }
    ]
  }
});

publishComposite('assignTeamToProject', function (id) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    id: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({id});

  let query = {_id: id, archived: false};
  let user = Meteor.users.findOne({_id: userId});
  let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
  if (selectedCompanyId) {
    query.companyId = selectedCompanyId;
  }
  return {
    find: function () {
      return Projects.find(query);
    },
    children: [
      {
        find: function (project) {
          let query = {archived: false};
          if (selectedCompanyId) {
            query.assignedCompanyId = selectedCompanyId;
          }
          return Teams.find(query);
        },
        children: [
          {
            find: function (team, project) {
              return Meteor.users.find({_id: team.membersIds}, {
                fields: {profile: 1, roles: 1, emails: 1}
              });
            }
          }
        ]
      }
    ]
  }
});

publishComposite('editProject', function (id) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    id: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({id});

  let query = {ownerId: userId};

  let user = Meteor.users.findOne({_id: userId});
  let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
  if (selectedCompanyId) {
    query.companyId = selectedCompanyId;
  }
  return {
    find: function () {
      return Projects.find(query, {fields: {name: 1, description: 1, projectKey: 1, tags: 1, companyId: 1}});
    },
    children: []
  }
});

Meteor.publish('projectsList', function (query, params) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  else {
    let projectsAdmin = Roles.getGroupsForUser(userId, 'project-admin');
    let projectsOwner = Roles.getGroupsForUser(userId, 'project-owner');
    let projectsManager = Roles.getGroupsForUser(userId, 'project-manager');
    let projectsWorker = Roles.getGroupsForUser(userId, 'project-worker');
    let projectsObserver = Roles.getGroupsForUser(userId, 'project-observer');
    let relatedProjectsDirectly = _.union(projectsAdmin, projectsOwner, projectsManager, projectsWorker, projectsObserver);
    query._id = {$in: relatedProjectsDirectly};
  }

  Counts.publish(this, 'projects-dashboard-counts', Projects.find(query), {noReady: true});
  return Projects.find(query, {
    limit: params.limit,
    fields: {
      name: 1,
      description: 1,
      projectKey: 1,
      tags: 1,
      companyId: 1,
      ownerId: 1,
      createdAt: 1,
      updatedAt: 1,
      archived: 1,
      assignedUsersIds: 1,
      info: 1,
      trackingInfo: 1,
      tasksInfo: 1
    }
  });
});

publishComposite('projects.projectsListNew', function (query, params) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  return {
    find: function () {
      return Meteor.users.find({_id: userId});
    },
    children: [
      {
        find: function (user) {
          let selectedCompanyId = user.profile && user.profile.selectedCompanyId;
          if (selectedCompanyId) {
            query.companyId = selectedCompanyId;
          }
          else {
            delete query.companyId;
          }

          let projectsAdmin = Roles.getGroupsForUser(userId, 'project-admin');
          let projectsOwner = Roles.getGroupsForUser(userId, 'project-owner');
          let projectsManager = Roles.getGroupsForUser(userId, 'project-manager');
          let projectsWorker = Roles.getGroupsForUser(userId, 'project-worker');
          let projectsObserver = Roles.getGroupsForUser(userId, 'project-observer');
          let relatedProjectsDirectly = _.union(projectsAdmin, projectsOwner, projectsManager, projectsWorker, projectsObserver);
          query._id = {$in: relatedProjectsDirectly};

          Counts.publish(this, 'projects-dashboard-counts', Projects.find(query), {noReady: true});
          return Projects.find(query, {
            limit: params.limit,
            fields: {
              name: 1,
              description: 1,
              projectKey: 1,
              tags: 1,
              companyId: 1,
              ownerId: 1,
              createdAt: 1,
              updatedAt: 1,
              archived: 1,
              assignedUsersIds: 1,
              info: 1,
              trackingInfo: 1,
              tasksInfo: 1
            }, sort: {name: -1}
          });
        }
      }
    ]
  }
});

publishComposite('projectInfo', function (id) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    id: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({id});
  return {
    find: function () {
      if (id) {
        return Projects.find({_id: id}, {fields: {tags: 0}});
      }
    },
    children: [
      {
        find: function (project) {
          let assignedUsersIds = project.assignedUsersIds;
          let ownerId = project.ownerId;
          let usersIds = _.unique(_.union(assignedUsersIds, ownerId));
          return Meteor.users.find({_id: {$in: usersIds}}, {
            fields: {profile: 1, roles: 1, emails: 1}
          });
        }
      },
      {
        find: function (project) {
          let ownerId = project.ownerId;
          return Contracts.find({employerId: ownerId, projectIds: project._id});
        },
        children: [
          {
            find: function (contract, project) {
              let workerId = contract.workerId;
              return Meteor.users.find({_id: workerId}, {
                fields: {profile: 1, roles: 1, emails: 1}
              });
            }
          }
        ]
      }
    ]
  }
});

Meteor.publishComposite('projectActivityMessages', function (id) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    id: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  }).validate({id});

  const projectFields = {
    sort: {createdAt: 1},
    fields: {
      tags: 0,
      projectFiles: 0
    }
  };

  return {
    find: function () {
      if (id) {
        return Projects.find({
          _id: id
        }, projectFields);
      }
    },
    children: [
      {
        find: function (project) {
          let activityMessagesIds = project.activityMessagesIds || [];
          return ActivityMessages.find({_id: {$in: activityMessagesIds}});
        },
        children: [
          {
            find: function (message, project) {
              let replyedMessagesIds = message.replyedMessagesIds || [];
              return ActivityMessages.find({_id: {$in: replyedMessagesIds}});
            }
          },
          {
            find: function (message, project) {
              let projectOwner = message.projectOwner;
              let changedUsersIds = message.changedUsersIds || [];
              if (projectOwner) {
                changedUsersIds.push(projectOwner);
              }
              return Meteor.users.find({_id: {$in: changedUsersIds}}, {
                fields: {profile: 1}
              });
            }
          }
        ]
      }
    ]
  }
});

Meteor.publish('projectsByNameRegExp', function (searchString) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    searchString: {
      type: String,
      optional: true
    }
  }).validate({searchString});

  let searchParams = {};
  if (searchString != '') {
    let searchStringRegExp = new RegExp(searchString, 'ig');
    searchParams.name = {$regex: searchStringRegExp};
  }

  searchParams.ownerId = userId;
  searchParams.archived = false;

  return Projects.find(searchParams, {limit: 10, fields: {name: 1, ownerId: 1, archived: 1}});
});

Meteor.publish('projectsByNameRegExpAlternative', function (searchString, limit, addQuery = {}, addOptions = {}) {
  if (!this.userId) {
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

  const userId = this.userId;

  let projectsCreatedByUser = Roles.getGroupsForUser(userId, 'project-owner');
  let projectsWhereUserIsAdmin = Roles.getGroupsForUser(userId, 'project-admin');
  let projectsWhereUserIsManamger = Roles.getGroupsForUser(userId, 'project-manager');

  let relatedProjectsDirectly = _.union(projectsCreatedByUser, projectsWhereUserIsAdmin, projectsWhereUserIsManamger);

  const query = Object.assign({archived: false}, addQuery);
  const options = Object.assign({limit, sort: {name: 1}}, addOptions);

  if (searchString) {
    const searchStringRegExp = new RegExp(searchString, 'ig');
    query.name = {$regex: searchStringRegExp};
  }
  query._id = {$in: relatedProjectsDirectly};

  return Projects.find(query, options);
});

Meteor.publish('clientGoogleProjects', function (userId) {
  if (!userId) {
    return this.ready();
  }
  return Projects.find({
    $or: [
      {ownerId: userId},
      {assignedUsersIds: userId}
    ]
  });
});

Meteor.publish('projects', function () {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }

  const projectFields = {
    sort: {createdAt: 1},
    fields: {
      activityMessagesIds: 0,
      tags: 0,
      description: 0,
      projectFiles: 0
    }
  };

  return Projects.find({
    $or: [{assignedUsersIds: userId}, {ownerId: userId}],
    archived: false
  }, projectFields);
});

