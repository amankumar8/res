import { UserEducation } from '../userEducations';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Meteor.publish('userEducation', function (selectedUser, limit) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
      selectedUser: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        limit: {
            type: Number
        }
    }).validate({ selectedUser, limit });
    let user = Meteor.users.findOne({_id: selectedUser});
    let educationIds = user && user.profile && user.profile.educationIds || [];
    if(educationIds && educationIds.length > 0){
      return UserEducation.find({
        _id: {
          $in: educationIds
        }
      }, {
        sort: {
          completeAt: -1
        },
        limit: limit
      });
    }
    else {
      return this.ready();
    }
});