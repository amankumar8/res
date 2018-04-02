import { WebApp } from 'meteor/webapp';
import { Router } from 'meteor/iron:router';
import helpers from './helpers';

import './tasks';
import './projects';
import './googleCloud';
import './video';

const apiRoutes = [
  '/api/tasks',
  '/api/projects',
  '/api/googleCloud',
  '/videoMeta'
];

const routes = Router.routes.map((route) => {
  return new RegExp(route.options.path);
});

WebApp.rawConnectHandlers.use(function(req, res, next) {
  if (Meteor.settings.isDev) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3004');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://vez.io');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  return next();
});

// https://github.com/iron-meteor/iron-router/issues/1055
WebApp.connectHandlers.use('/', (req, res, next) => {
  if (req.url === '/' || matchRouterRoutes(req.url) || apiRoutes.includes(req.url)) {
    next();
  } else {
    helpers.endErrorRequest(res, 404, 'Page not found');
  }
});

function matchRouterRoutes(url) {
  for (let x = 0, count = routes.length; x < count; x++) {
    if (routes[x].test(url) === true) {
      return true;
    }
  }
  return false;
}
