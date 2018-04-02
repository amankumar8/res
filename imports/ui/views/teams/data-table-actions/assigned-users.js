import './assigned-users.html';

Template.assignedTeamUsers.onCreated(function () {
    let membersIds = this.data.membersIds || [];
    this.autorun(() => {
        this.subscribe('assignedUsers', membersIds);
    });
});
Template.assignedTeamUsers.helpers({
    userName(userId){
        let user = Meteor.users.findOne({_id: userId}, {
            fields: {profile: 1, roles: 1, emails: 1}
        });
        return  user && user.profile && user.profile.fullName;
    }
});