import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Tasks } from '/imports/api/tasks/tasks';

export const getCoordinatesFromAddress = new ValidatedMethod({
    name: 'getCoordinatesFromAddress',
    validate: new SimpleSchema({
        params: {
            type: Object,
        }
    }).validator(),
    run({params}) {
        check(params, {
            country: Match.Optional(String),
            city: Match.Optional(String),
            address: Match.Optional(String),
            zip: Match.Optional(String)
        });
        params.city = encodeURIComponent(params.city);
        params.address = encodeURIComponent(params.address);

        let address = _.values(params);

        if (address) {
            let apiKey = Meteor.settings.public.MAPS_API_KEY;

            let url = 'https://maps.googleapis.com/maps/api/geocode/json?address='
                + address + '&key=' + apiKey;
            let res = HTTP.call('GET', url);
            if (res.data.results[0] && res.data.results[0].geometry) {
                return res.data.results[0].geometry.location;
            }
        }
        throw new Meteor.Error('Wrong address!');
    }
});


export const getTimeZoneNameFromCoordinates = new ValidatedMethod({
    name: 'getTimeZoneNameFromCoordinates',
    validate: new SimpleSchema({
        lat: { type: String, },
        lng: { type: String, },
    }).validator(),
    run({lat, lng}) {
        if (lat && lng) {
            let now = moment().unix();
            let apiKey = Meteor.settings.public.TIME_ZONE_API_KEY;
            let url = 'https://maps.googleapis.com/maps/api/timezone/json?location='
                + lat + ',' + lng + '&timestamp=' + now + '&key=' + apiKey;
            let resultJSON = HTTP.get(url, {});
            return JSON.parse(resultJSON.content);
        }
        throw new Meteor.Error('Wrong address!');
    }
});

export const getTimeZoneNameFromCoordinatesForUsers = new ValidatedMethod({
    name: 'getTimeZoneNameFromCoordinatesForUsers',
    validate: new SimpleSchema({
        usersWithLocation: { type: [String], },
    }).validator(),
    run({usersWithLocation}) {
        let userWithLocations = [];
        for (let i = 0; i < usersWithLocation.length; i++) {
            let userCoordinates = usersWithLocation[i].profile.location.coordinates;
            let lat = userCoordinates.lat;
            let lng = userCoordinates.lng;
            if (lat && lng) {
                let now = moment().unix();
                let apiKey = Meteor.settings.public.TIME_ZONE_API_KEY;
                let url = 'https://maps.googleapis.com/maps/api/timezone/json?location='
                    + lat + ',' + lng + '&timestamp=' + now + '&key=' + apiKey;
                let result = JSON.parse(resultJSON.content);
                let resultJSON = HTTP.get(url, {});
                let timeZoneId = result.timeZoneId;
                userWithLocations.push({userId: usersWithLocation[i]._id, timeZoneId: timeZoneId});
            }
        }
        return userWithLocations;
    }
});


/**
 * Upload photo to Google Storage, returns medialink to uploaded photo
 * @params.name {string} filename.
 * @params.type {string} photo type.
 * @params.bucketName {string} name of google storage bucket
 * @params.buffer {uInt8Array} buffer with photo
 */
export const uploadPhoto = new ValidatedMethod({
    name: 'uploadPhoto',
    validate: null,
    run(params) {
        const userId = this.userId || params.userId;
        if (!userId) {
            throw new Meteor.Error('uploadPhoto.notLoggedIn',
                'Must be logged in.');
        }
        if(Meteor.isServer){
            import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';
            let typeRegEx = /^image\/(jpeg|JPEG|png|PNG|gif|GIF|tif|TIF)$/;
            if (!typeRegEx.test(params.type)) {
                throw new Meteor.Error('Should be an image!');
            }

            if (params.buffer.length > 5 * 1000 * 1000) {
                throw new Meteor.Error('Image size should be less than 5MB!');
            }

            let file = {
                name: params.name,
                type: params.type,
                size: params.buffer.length,
                data: params.buffer,
                perms: 'publicRead'
            };

            let Google = new GoogleApi();
            return Google.uploadFile(file, params.bucketName).data.mediaLink;
        }
    }
});

export const uploadVideo = new ValidatedMethod({
    name: 'uploadVideo',
    validate: null,
    run(params) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('uploadVideo.notLoggedIn',
                'Must be logged in.');
        }
        if(Meteor.isServer){
            import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';
            let file = {
                name: params.name,
                type: params.type,
                size: params.buffer.length,
                data: params.buffer,
                perms: 'publicRead'
            };

            try {
                let Google = new GoogleApi();
                return Google.uploadFile(file, params.bucketName).data.mediaLink;
            } catch (e) {
              throw new Meteor.Error('uploadVideo.uploadFail', e.message);
            }
        }
    }
});

export const uploadProjectFile = new ValidatedMethod({
    name: 'uploadFile',
    validate: null,
    run({filesToUpload}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('uploadFile.notLoggedIn',
                'Must be logged in.');
        }
        if(Meteor.isServer){
            import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';
            let uploadedFiles = [];
            let Google = new GoogleApi();
            if (filesToUpload.length > 0) {
                for (let i = 0; i < filesToUpload.length; i++) {
                    let result = Google.uploadFile(filesToUpload[i], 'vezio_projects_files');
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
    }
});

export const uploadTaskFile = new ValidatedMethod({
    name: 'uploadTaskFile',
    validate: null,
    run(fileToUpload) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('uploadTaskFile.notLoggedIn',
                'Must be logged in.');
        }
        if(Meteor.isServer){
            import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';
            if (_.keys(fileToUpload).length > 0) {
                let Google = new GoogleApi();
                let result = Google.uploadFile(fileToUpload, 'vezio_tasks_files');
                return {
                    fileName: result.data.name,
                    mediaLink: result.data.mediaLink,
                    size: parseInt(result.data.size),
                    uploaded: new Date(result.data.timeCreated)
                };
            }
        }
    }
});

export const uploadTaskFileP = new ValidatedMethod({
    name: 'uploadTaskFileP',
    validate: null,
    run(fileToUpload) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('uploadTaskFileP.notLoggedIn',
                'Must be logged in.');
        }
        if(Meteor.isServer){
            import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';
            if (_.keys(fileToUpload).length > 0) {
                let Google = new GoogleApi();
                let uploadedFile = {};
                let taskId = fileToUpload.taskId;
                fileToUpload = _.omit(fileToUpload, 'taskId');
                let result = Google.uploadFile(fileToUpload, 'vezio_tasks_files');
                uploadedFile = {
                    fileName: result.data.name,
                    mediaLink: result.data.mediaLink,
                    size: parseInt(result.data.size),
                    uploaded: new Date(result.data.timeCreated)
                };
                if (taskId != 'new-task') {
                    Tasks.update(taskId, {$push: {taskFiles: uploadedFile}});
                }
                return uploadedFile;
            }
        }
    }
});

export const uploadVideoP = new ValidatedMethod({
    name: 'uploadVideoP',
    validate: null,
    run(videotoUpload) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('uploadVideoP.notLoggedIn',
                'Must be logged in.');
        }
        if(Meteor.isServer){
            import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';
            if (_.keys(videotoUpload).length > 0) {
                let Google = new GoogleApi();
                let result = Google.uploadFile(videotoUpload, 'vezio_tasks_files');
                let uploadedFile= {};
                uploadedFile = {
                    fileName: result.data.name,
                    mediaLink: result.data.mediaLink,
                    size: parseInt(result.data.size),
                    uploaded: new Date(result.data.timeCreated),
                    type: 'video'
                };
                if (taskId != 'new-task') {
                    Tasks.update(taskId, {$push: {taskFiles: uploadedFile}});
                }
                return uploadedFile;
            }
        }
    }
});

export const uploadMessageFile = new ValidatedMethod({
    name: 'uploadMessageFile',
    validate: null,
    run(file) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('uploadMessageFile.notLoggedIn',
                'Must be logged in.');
        }
        if(Meteor.isServer){
            import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';
            let Google = new GoogleApi();
            if (file) {
                let result = Google.uploadFile(file, 'vezio_projects_files');
                return {fileName: result.data.name, mediaLink: result.data.mediaLink};
            }
        }
    }
});

export const getFileMediaLink = new ValidatedMethod({
  name: 'getFileMediaLink',
  validate: null,
  run({bucketName, fileName}) {
    if (Meteor.isServer) {
      import {GoogleApi} from '/imports/api/google-services/server/google-api/connector';
      let Google = new GoogleApi();
      return Google.getFile(bucketName, fileName, function (err, res) {
        if (err) {
          console.log(err);
        }
        else {
          return res.data.mediaLink
        }
      });
    }
  }
});