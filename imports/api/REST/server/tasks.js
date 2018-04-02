import { WebApp } from 'meteor/webapp';
import { Tasks } from '/imports/api/tasks/tasks';
import { createTaskDesktop } from '/imports/api/tasks/methods';
import helpers from './helpers';

WebApp.connectHandlers.use('/api/tasks/count', (req, res, next) => {
  if (req.method === 'GET') {
    const tasksCount = Tasks.find().count();
    helpers.endDataRequest(res, 200, { tasksCount });
  } else {
    next();
  }
});

WebApp.connectHandlers.use('/api/tasks', (req, res, next) => {
  if (req.method === 'GET') {
    if (checkGETRequest(req, res)) {
      const query = makeQuery(req);
      const options = makeOptions(req, query);
      const tasks = Tasks.find(query, options).fetch();
      const result = {
        tasks,
        resultCount: tasks.length,
        currentPage: parseInt(req.query.pageNumber || 0),
        pageCount: tasks.length / options.limit
      };
      helpers.endDataRequest(res, 200, result);
    }
  } else if (req.method === 'POST') {
    helpers.loadData(req, { doParse: true})
      .then(data => {
        const authCheckResult = helpers.authCheck(data.userId);
        if (!authCheckResult.isAuthorized) {
          helpers.endErrorRequest(res, 401, authCheckResult.message);
        } else {
          let result;
          try {
            result = createTaskDesktop.call(data);
            helpers.endDataRequest(res, 201, result);
          } catch (err) {
            if (err.error === 'validation-error') {
              helpers.endErrorRequest(res, 400, err.message);
            } else {
              helpers.endErrorRequest(res, 500, 'internal server error');
            }
          }
        }
      })
      .catch(err => {
        helpers.endErrorRequest(res, 400, err);
      });
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
    status: 'Opened',
    membersIds: req.query.userId
  };
  return helpers.makeGetQuery(baseQuery, req.query)
}

function makeOptions(req, query) {
  const itemsPerPage = parseInt(req.query.itemsPerPage || 0);
  const pageNumber = parseInt(req.query.pageNumber || 0);
  const baseOptions = {
    limit: itemsPerPage > 0 ? itemsPerPage : Tasks.find(query).count(),
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
      status: 0
    }
  };
  return req.query.options ? {...baseOptions, ...req.query.options } : {
    ...baseOptions,
    ...defaultOptions
  };
}
