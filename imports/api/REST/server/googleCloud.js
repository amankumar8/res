import { WebApp } from 'meteor/webapp';
import parseFormdata from 'parse-formdata';
import helpers from './helpers';
import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';

WebApp.connectHandlers.use('/api/googleCloud/uploadFiles', (req, res, next) => {
  if (req.method === 'POST') {
    parseFilesData(req)
      .then((reqData) => {
        const authCheckResult = helpers.authCheck(reqData.userId);
        if (!authCheckResult.isAuthorized) {
          helpers.endErrorRequest(res, 401, authCheckResult.message);
        }
        const filesLoadPromises = getFilesLoadPromises(reqData);
        Promise.all(filesLoadPromises)
          .then(filesToUpload => {
            try {
              const Google = new GoogleApi();
              checkLimit(filesToUpload, reqData, Google);
              const uploadedFiles = uploadFilesToCloud(filesToUpload, reqData.bucket, Google);
              helpers.endDataRequest(res, 200, uploadedFiles);
            } catch (error) {
              helpers.endErrorRequest(res, 500, error);
            }
          });
      })
      .catch(err => {
        helpers.endErrorRequest(res, 400, err);
      });
  } else {
    next();
  }
});

WebApp.connectHandlers.use('/api/googleCloud/userFilesSize', (req, res, next) => {
  if (req.method === 'GET') {
    let Google = new GoogleApi();
    const userId = req.query.userId;
    const bucket = req.query.bucket;
    try {
      let userFilesMetadata = Google.getFilesMetadata(bucket, `${userId}/`).items || [];
      const userFilesSize = getUserFilesSize(userFilesMetadata);
      helpers.endDataRequest(res, 200, { userFilesSize });
    } catch (error) {
      helpers.endErrorRequest(res, 400, error);
    }
  } else {
    next();
  }
});

WebApp.connectHandlers.use('/api/googleCloud/userFiles', (req, res, next) => {
  if (req.method === 'GET') {
    let Google = new GoogleApi();
    const userId = req.query.userId;
    const bucket = req.query.bucket;
    try {
      const userFilesMetadata = Google.getFilesMetadata(bucket, `${userId}/`).items || [];
      helpers.endDataRequest(res, 200, userFilesMetadata);
    } catch (error) {
      helpers.endErrorRequest(res, 400, error);
    }
  } else {
    next();
  }
});

WebApp.connectHandlers.use('/api/googleCloud/deleteUserFile', (req, res, next) => {
  if (req.method === 'DELETE') {
    let Google = new GoogleApi();
    const userId = req.query.userId;
    const bucket = req.query.bucket;
    const fileName = req.query.fileName;
    try {
      Google.deleteFile(bucket, `${userId}%2F${fileName}`);
      helpers.endDataRequest(res, 200, { message: 'success' });
    } catch (error) {
      helpers.endErrorRequest(res, error.code || 400, error.message);
    }
  } else {
    next();
  }
});

function parseFilesData(req) {
  return new Promise((resolve, reject) => {
    parseFormdata(req, (err, data) => {
      if (err) {
        helpers.endErrorRequest(res, 400, err);
      }
      resolve({
        userId: data.fields.userId,
        bucket: data.fields.bucket,
        filesParts: data.parts,
      });
    });
  });
}

function getUserFilesSize(filesMetadata) {
  const folderSize = filesMetadata.reduce((sum, metadata) => sum + parseInt(metadata.size), 0);
  return folderSize;
}

function getFilesLoadPromises(reqData) {
  const filesLoadPromises = [];
  for (let i = 0; i < reqData.filesParts.length; i++) {
    const fileData = reqData.filesParts[i];
    filesLoadPromises.push(helpers.loadFile(fileData, reqData.userId));
  }
  return filesLoadPromises;
}

function checkLimit(filesToUpload, reqData, Google) {
  const userFilesMetadata = Google.getFilesMetadata(reqData.bucket, `${reqData.userId}/`).items || [];
  const userFilesSize = getUserFilesSize(userFilesMetadata);
  const allFilesSize = filesToUpload.reduce((sum, file) => sum + parseInt(file.size), userFilesSize);
  const maxLimit = 2 * helpers.oneGb;	// There must be a dynamic limit for each user
  if (allFilesSize > maxLimit) {
    helpers.endErrorRequest(res, 403, `Exceeded the limit for uploading files in ${maxLimit / helpers.oneGb}GB`);
  }
}

function uploadFilesToCloud(filesToUpload, bucket, Google) {
  const uploadedFiles = [];
  if (filesToUpload.length > 0) {
    for (let i = 0; i < filesToUpload.length; i++) {
      const result = Google.uploadFile(filesToUpload[i], bucket);
      uploadedFiles.push({
        fileName: result.data.name,
        mediaLink: result.data.mediaLink,
        size: parseInt(result.data.size),
        uploaded: new Date(result.data.timeCreated)
      });
    }
  }
  return uploadedFiles;
}
