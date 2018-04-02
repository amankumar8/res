import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Router } from 'meteor/iron:router';
import { VZ } from '/imports/startup/both/namespace'
import './videoShare.html';

Template.videoShare.onCreated(function () {
  const url = `https://goo.gl/${Router.current().params.url}`;
  this.videoUrl = new ReactiveVar(url);
  this.videoType = new ReactiveVar(null);
  this.videoName = new ReactiveVar('');
  this.uploadedAt = new ReactiveVar(null);
  this.isReady = new ReactiveVar(false);
  Meteor.call('getVideoMeta', 'vezio_videos', url, (err, res) => {
    if (err) {
      console.error(err);
      VZ.notify(err);
      this.isReady.set(true);
    } else {
      this.videoType.set(res.contentType);
      this.videoName.set(res.name.substring(res.name.indexOf('/') + '/'.length));
      this.uploadedAt.set(res.timeCreated);
      this.isReady.set(true);
    }
  });
});

Template.videoShare.events({
  'loadedmetadata #video-player': function(event) {
    const myVideoPlayer = event.target;
    if (myVideoPlayer.duration === Infinity) {
      myVideoPlayer.currentTime = Number.MAX_SAFE_INTEGER;
      myVideoPlayer.ontimeupdate = () => {
        myVideoPlayer.ontimeupdate = null;
        myVideoPlayer.currentTime = 0;
      };
    }
  },
});

Template.videoShare.helpers({
  videoUrl() {
    const template = Template.instance();
    if (template.isReady.get() === true) {
      return template.videoUrl.get();
    }
  },
  videoType() {
    const template = Template.instance();
    if (template.isReady.get() === true) {
      return template.videoType.get();
    }
  },
  videoName() {
    return Template.instance().videoName.get();
    // const { url } = parse(Router.current().request.url);
    // const encodedSlashIndex = url.indexOf('%2F');
    // return encodedSlashIndex > -1 ? url.substring(encodedSlashIndex + '%2F'.length) : 'video has no name';
  },
  uploadedAt() {
    const template = Template.instance();
    if (template.isReady.get() === true) {
      const uploadedAt = template.uploadedAt.get();
      console.log('uploadedAt', uploadedAt);
      return moment(uploadedAt).format('Do MMMM YYYY HH:mm:ss');
    }
    // const { uploadedAt } = parse(Router.current().request.url);
    // return uploadedAt ? moment(parseInt(uploadedAt)).format('Do MMMM YYYY HH:mm:ss') : '';
  },
  isReady() {
    return Template.instance().isReady.get();
  }
});

function parse(urlToParse) {
  const firstSign = urlToParse.indexOf('?');
  const params = urlToParse.substring(firstSign + '?'.length);
  const startOfUrl = params.indexOf('url=');
  let endOfUrl = params.indexOf('media') + 'media'.length;
  if (params.indexOf('media') === -1) {
    endOfUrl = params.substring(startOfUrl).indexOf('&');
  }
  if (endOfUrl === -1) {
    endOfUrl = params.length;
  }
  const url = params.substring(startOfUrl + 'url='.length, endOfUrl);
  /*const startOfType = params.indexOf('type=');
  let type = params.substring(startOfType + 'type='.length);
  const endOfType = type.indexOf('&');
  if (endOfType !== -1) {
    type = type.substring(0, endOfType);
  }
  const startOfUploaded = params.indexOf('uploadedAt=');
  let uploadedAt = params.substring(startOfUploaded +'uploadedAt='.length);
  const endOfUploaded = uploadedAt.indexOf('&');
  if (endOfUploaded !== -1) {
    uploadedAt = uploadedAt.substring(0, endOfUploaded);
  }*/
  return {
    url,
  }
}