import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';

const oneKb = 1024;
const oneMb = 1024 * oneKb;
const oneGb = 1024 * oneMb;

const helpers = {
  oneKb, oneMb, oneGb,
  endErrorRequest(res, code, message) {
    res.writeHead(code, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(message)
    });
    res.end(message);
  },
  endDataRequest(res, code, data) {
    let dataToSend = data;
    if (dataToSend && typeof dataToSend !== 'string') {
      dataToSend = JSON.stringify(dataToSend);
    }
    res.writeHead(code, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataToSend)
    });
    res.end(dataToSend);
  },
  loadData(req, { doParse = false }) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        if (data === '') {
          reject('no data sent');
        } else {
          if (doParse) {
            let result;
            try {
              result = JSON.parse(data);
              resolve(result);
            } catch (err) {
              reject('request data is not valid json');
            }
          } else {
            resolve(data);
          }
        }
      });

      req.on('error', (err) => {
        reject(err.message);
      });
    });
  },
  loadFile(fileData, path) {
    return new Promise((resolve, reject) => {
      let chunkData = [];
      fileData.stream.on('data', (chunk) => {
        chunkData.push(chunk);
      });

      fileData.stream.on('end', () => {
        if (chunkData.length === 0) {
          reject('No data sent');
        } else {
          const buffer = Buffer.concat(chunkData);
          const file = {
            name: `${path}/${fileData.filename}`,
            type: fileData.mimetype,
            size: buffer.length,
            data: buffer,
            perms: 'publicRead',
          };
          if (file.size > 10 * oneMb) {
            reject('File size should be less than 10MB!');
          }
          resolve(file);
        }
      });
    });
  },
  authCheck(userId) {
    if (!userId) {
      return {
        isAuthorized: false,
        message: 'userId not specified'
      }
    } else if (!Meteor.users.findOne({ _id: userId })) {
      return {
        isAuthorized: false,
        message: 'user not found'
      }
    }
    return {
      isAuthorized: true
    };
  },
  validateGET({ itemsPerPage, pageNumber }) {
    const itemsPerPageParsed = parseInt(itemsPerPage || 0);
    const pageNumberParsed = parseInt(pageNumber || 0);
    if (isNaN(itemsPerPageParsed) || itemsPerPageParsed < 0 || itemsPerPageParsed % 1 > 0) {
      return {
        isValid: false,
        message: 'itemsPerPage must be non-negative integer'
      };
    } else if (isNaN(pageNumberParsed) || pageNumberParsed < 0 || pageNumberParsed % 1 > 0) {
      return {
        isValid: false,
        message: 'pageNumber must be non-negative integer'
      };
    }
    return {
      isValid: true
    };
  },
  makeGetQuery(baseQuery, params) {
    const omitParams = ['userId', 'itemsPerPage', 'pageNumber', 'options'];

    const paramsQuery = {};
    for (let param in params) {
      if (!omitParams.includes(param) && params.hasOwnProperty(param) && params[param]) {
        paramsQuery[param] = params[param];
      }
    }
    return {...baseQuery, ...paramsQuery};
  }
};

export default helpers;