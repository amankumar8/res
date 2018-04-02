import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

export const getCollectionData = new ValidatedMethod({
  name: 'collections.getCollectionData',
  validate: null,
  run({ collectionName, query, options }) {
    let newQuery = query || {};
    let newOptions = options || {};

    if (!collectionName) {
      throw new Meteor.Error('collections.getCollectionData', 'Collection name required');
    }
    let collection = Mongo.Collection.get(collectionName);
    let collectionData = collection.find(newQuery, newOptions).fetch();
    collectionData = JSON.stringify(collectionData);
    return collectionData;
  }
});

export const getUsersByIds = new ValidatedMethod({
  name: 'collections.getUsersByIds',
  validate: null,
  run({ userIds }) {
    userIds = userIds || [];
    let users = Meteor.users.find({_id: {$in: userIds}}).fetch();
    let usersData  = users.map((user) => {
      let fullName = user.profile && user.profile.fullName || '';
      let profilePhoto = user.profile && user.profile.photo && user.profile.photo.large || '';
      return {_id: user._id, fullName: fullName, profilePhoto: profilePhoto}
    });

    usersData = JSON.stringify(usersData);
    return usersData;
  }
});