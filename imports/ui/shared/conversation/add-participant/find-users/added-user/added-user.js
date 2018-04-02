import './added-user.html';

Template.addedUser.onCreated(function () {
});

Template.addedUser.onRendered(function () {
});

Template.addedUser.onDestroyed(function () {
});

Template.addedUser.helpers({
    userId() {
        return this.addedUser._id;
    }
});

Template.addedUser.events({
    'click .delete-assignedUser-icon': function (event, tmpl) {
        let userId = tmpl.data.addedUser._id;
        tmpl.data.onRemove(userId);
    }
});
