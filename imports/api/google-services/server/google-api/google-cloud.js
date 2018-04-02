import { GoogleApi } from './connector';

GoogleApi.prototype.bucketList = function (cb) {
  let token = this.token;
  let privateInfo = Meteor.settings.private.GOOGLE;
  Meteor.wrapAsync(HTTP.get, this);
  try {
    let res = HTTP.get('https://www.googleapis.com/storage/v1/b', {
      headers: {
        Authorization: 'Bearer' + ' ' + token
      },
      params: {
        project: privateInfo.project_id
      }
    });
    return cb(null, res.data.items);
  }
  catch (err) {
    cb(err);
  }
};

GoogleApi.prototype.uploadFile = function (file, bucket, cb) {
  let token = this.token;
  let privateInfo = Meteor.settings.private.GOOGLE;
  Meteor.wrapAsync(HTTP.post, this);
  try {
    let res = HTTP.post('https://www.googleapis.com/upload/storage/v1/b/' + bucket + '/o', {
      headers: {
        'Content-Type': file.type,
        // 'Content-Disposition': 'inline',
        'Content-Length': file.size,
        Authorization: 'Bearer' + ' ' + token
      },
      params: {
        project: privateInfo.project_id,
        uploadType: 'media',
        name: file.name,
        predefinedAcl: file.perms
      },
      content: file.data
    });
    if (cb) {
      return cb(null, res);
    }
    else {
      return res;
    }
  }
  catch (err) {
    if (cb) {
      cb(err, null);
    } else {
      throw err;
    }
  }
};

GoogleApi.prototype.getFilesMetadata = function (bucket, path, cb) {
  let token = this.token;
  Meteor.wrapAsync(HTTP.get, this);
  try {
    let res = HTTP.get(`https://www.googleapis.com/storage/v1/b/${bucket}/o`, {
      headers: {
        Authorization: 'Bearer' + ' ' + token
      },
      params: {
        prefix: path,
        delimiter: '/',
      },
    });
    if (cb) {
      return cb(null, res.data);
    }
    else {
      return res.data;
    }
  }
  catch (err) {
    if (cb) {
      cb(err, null);
    } else {
      throw err;
    }
  }
};

GoogleApi.prototype.deleteFile = function (bucket, fileName, cb) {
  let token = this.token;
  Meteor.wrapAsync(HTTP.del, this);
  try {
    let res = HTTP.del(`https://www.googleapis.com/storage/v1/b/${bucket}/o/${fileName}`, {
      headers: {
        Authorization: 'Bearer' + ' ' + token
      },
    });
    if (cb) {
      return cb(null, res.data);
    }
    else {
      return res.data;
    }
  }
  catch (err) {
    if (cb) {
      cb(err.response.data.error, null);
    } else {
      throw err.response.data.error;
    }
  }
};

GoogleApi.prototype.getFile = function (bucket, fileName, cb) {
  let token = this.token;
  try {
    let res = HTTP.get('https://www.googleapis.com/storage/v1/b/' + bucket + '/o/' + fileName, {
      headers: {
        Authorization: 'Bearer' + ' ' + token
      },
      params: {
        //alt: 'media'
      }
    });
    if (cb) {
      return cb(null, res);
    }
    else {
      return res;
    }
  }
  catch (err) {
    if (cb) {
      cb(err);
    }
    else {
      return err
    }

  }
};

GoogleApi.prototype.requestHolidays = function (id) {
  Meteor.wrapAsync(HTTP.get, this);
  let result;
  const baseUrl = 'https://www.googleapis.com/calendar/v3';
  const calendarId = encodeURIComponent(id);
  const timeMin = encodeURIComponent(`${moment().year()}-01-01T00:00:00.00Z`);
  const timeMax = encodeURIComponent(`${moment().year() + 1}-01-01T00:00:00.00Z`);
  const fields = encodeURIComponent(`items(id,start)`);
  const apiKey = Meteor.settings.public.CALENDAR_API_KEY;
  const query = `timeMax=${timeMax}&timeMin=${timeMin}&fields=${fields}&key=${apiKey}`;
  const request = `${baseUrl}/calendars/${calendarId}/events?${query}`;
  const googleApiToken = this.token;
  try {
    result = HTTP.get(request, {
      headers: {
        Authorization: 'Bearer' + ' ' + googleApiToken
      },
      params: {
        project: Meteor.settings.private.GOOGLE.project_id
      }
    });
  } catch (err) {
    if (err) {
      throw new Meteor.Error(err);
    }
  }
  return result;
};

GoogleApi.prototype.expandUrl = function(url) {
  Meteor.wrapAsync(HTTP.get, this);
  let result = '';
  const baseUrl = 'https://www.googleapis.com/urlshortener/v1/url';
  const googleApiToken = this.token;
  const request = `${baseUrl}?shortUrl=${url}`;
  try {
    result = HTTP.get(request, {
      headers: {
        Authorization: `Bearer ${googleApiToken}`
      }
    });
    return result.data.longUrl;
  } catch (err) {
    console.error(err.response.content);
    const errContent = JSON.parse(err.response.content).error;
    throw new Meteor.Error(`Google url shortener expand error ${errContent.code} ${errContent.message}`);
  }
};