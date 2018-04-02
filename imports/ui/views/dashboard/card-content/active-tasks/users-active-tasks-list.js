import { Projects } from '/imports/api/projects/projects';

Template.usersActiveTasksList.helpers({
    trakingUser() {
        if(this.trakingUserId){
            return Meteor.users.findOne(this.trakingUserId);
        }
        else {
            return Meteor.users.findOne(this.ownerId);
        }
    },
    taskOwner() {
        if(this.workerId){
            return Meteor.users.findOne(this.workerId);
        }
        else {
            return Meteor.users.findOne(this.ownerId);
        }
    },
    taskOwnerAvatar() {
        let owner = Meteor.users.findOne(this.ownerId);
        if (!owner || !owner.profile) {
            return;
        }
        if (!owner.profile.photo || !owner.profile.photo.large) {
            return '/images/default-lockout.png'
        }

        return owner.profile.photo.large;
    },
    relatedProject() {
        let projectId = this.projectId;
        let project = Projects.findOne({_id: projectId});
        // console.log(project);
        return project;
    },
    statusToClass() {
        return this.status.split(' ').join('-').toLowerCase();
    }
});

Template.usersActiveTasksList.events({
    'click #task-name': function (event, tmpl) {
        event.preventDefault();
        let taskId = this._id;
        let projectId = this.projectId;
        Session.set('taskId', taskId);
        Router.go('projectDashboard', {id: projectId});
    }
});
