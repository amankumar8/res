import { Meteor } from 'meteor/meteor';
import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';

Meteor.methods({
  getVideoMeta(bucket, url) {
    const Google = new GoogleApi();
    let expandedUrl = url;
    if (url.indexOf('%2F') === -1) {
      expandedUrl = Google.expandUrl(url);
    }
    const userId = expandedUrl.substring(expandedUrl.indexOf('/o/') + '/o/'.length, expandedUrl.indexOf('%2F'));
    const metaInfo = Google.getFilesMetadata(bucket, `${userId}/`).items || [];
    if (metaInfo.length === 0) {
      throw new Meteor.Error('File was removed');
    }
    const info = metaInfo.find((fileMeta) => fileMeta.mediaLink === expandedUrl);
    if (!info) {
      throw new Meteor.Error('Cannot find file');
    }
    return info;
  }
});