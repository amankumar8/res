import {UserWorkExperience} from '../userWorkExperience';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

Meteor.publish('userWorkExperience', function (selectedUserId, limit) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    selectedUserId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    },
    limit: {
      type: Number
    }
  }).validate({selectedUserId, limit});
  let user = Meteor.users.findOne({_id: selectedUserId});
  let workExperienceIds = user && user.profile && user.profile.workExperienceIds || [];
  if (workExperienceIds && workExperienceIds.length > 0) {
    return UserWorkExperience.find({
      _id: {
        $in: workExperienceIds
      }
    }, {
      sort: {
        startAt: -1
      },
      limit: limit
    });
  }
  else {
    return this.ready();
  }
});