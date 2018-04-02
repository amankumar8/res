import { WebApp } from 'meteor/webapp';
import helpers from './helpers';

const videoBucket = 'vezio_videos';

WebApp.connectHandlers.use('/videoMeta', (req, res, next) => {
  if (req.method === 'GET') {
    const url = req.query.url;
    Meteor.call('getVideoMeta', videoBucket, url, (err, result) => {
      if (err) {
        helpers.endErrorRequest(res, 400, err.message);
      } else {
        helpers.endDataRequest(res, 200, result);
      }
    });
  } else {
    next();
  }
});
