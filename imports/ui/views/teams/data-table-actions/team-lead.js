import './team-lead.html';

Template.teamLead.onCreated(function () {
    this.autorun(() => {
        let userId = this.userId ? this.userId : this.data.ownerId;
        userId = userId || '';
        this.subscribe('user', userId);
    });
});
Template.teamLead.helpers({
    userName(userId){
        let user = Meteor.users.findOne({_id: userId}, {
            fields: {profile: 1, roles: 1, emails: 1}
        });
        return  user && user.profile && user.profile.fullName;
    },
    isUserId(userId){
        let user = this.userId;
        return user == userId;
    }
});