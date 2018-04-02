import {UserPortfolioProjects} from '../userPortfolioProjects';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

Meteor.publish('userPortfolioProjects', function (selectedUser) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  new SimpleSchema({
    selectedUser: {
      type: String,
      regEx: SimpleSchema.RegEx.Id
    }
  }).validate({selectedUser});
  let user = Meteor.users.findOne({_id: userId});
  let portfolioProjectsIds = user && user.profile && user.profile.portfolioProjects || [];
  if (portfolioProjectsIds && portfolioProjectsIds.length > 0) {
    return UserPortfolioProjects.find({
      _id: {
        $in: portfolioProjectsIds
      }
    }, {
      sort: {
        createdAt: -1
      }
    });
  }
  else {
    return this.ready();
  }
});