import { WebApp } from 'meteor/webapp';
import { Projects } from '/imports/api/projects/projects';
import { createProjectDesktop } from '/imports/api/projects/methods';
import helpers from './helpers';

WebApp.connectHandlers.use('/api/projects/count', (req, res, next) => {
  if (req.method === 'GET') {
    const projectsCount = Projects.find().count();
    helpers.endDataRequest(res, 200, { projectsCount });
  } else {
    next();
  }
});

WebApp.connectHandlers.use('/api/projects', (req, res, next) => {
  if (req.method === 'GET') {
    if (checkGETRequest(req, res)) {
      const query = makeQuery(req);
      const options = makeOptions(req, query);
      const projects = Projects.find(query, options).fetch();
      const result = {
        projects,
        resultCount: projects.length,
        currentPage: parseInt(req.query.pageNumber || 0),
        pageCount: projects.length / options.limit
      };
      helpers.endDataRequest(res, 200, result);
    }
  } else {
    next();
  }
});

function checkGETRequest(req, res) {
  const authCheckResult = helpers.authCheck(req.query.userId);
  const validationCheckResult = helpers.validateGET(req.query);
  if (!authCheckResult.isAuthorized) {
    helpers.endErrorRequest(res, 401, authCheckResult.message);
  } else if(!validationCheckResult.isValid) {
    helpers.endErrorRequest(res, 400, validationCheckResult.message);
  }
  return authCheckResult.isAuthorized && validationCheckResult.isValid;
}

function makeQuery(req) {
  const baseQuery = {
    archived: false,
    assignedUsersIds: req.query.userId
  };
  return helpers.makeGetQuery(baseQuery, req.params);
}

function makeOptions(req, query) {
  const itemsPerPage = parseInt(req.query.itemsPerPage || 0);
  const pageNumber = parseInt(req.query.pageNumber || 0);
  const baseOptions = {
    limit: itemsPerPage > 0 ? itemsPerPage : Projects.find(query).count(),
    skip: pageNumber * itemsPerPage,
  };
  const defaultOptions = {
    fields: {
      ownerId: 0,
      archived: 0,
      createdAt: 0,
      createdBy: 0,
      editedAt: 0,
      editedBy: 0,
    }
  };
  return req.query.options ? {...baseOptions, ...req.query.options } : {
    ...baseOptions,
    ...defaultOptions
  };
}
