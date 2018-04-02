import './assigned-user-item.html';

Template.assignedUserItem.onCreated(function () {
});

Template.assignedUserItem.helpers({
});

Template.assignedUserItem.events({
    'click .change-user-roles-icon': function (event, tmpl) {
        let userId = tmpl.data.assignedUser._id;
        let userPositions = tmpl.data.assignedUser.positions;
        tmpl.data.onChangeRoles(userId, userPositions);
    },
    'click .remove-user-icon': function (event, tmpl) {
        let userId = tmpl.data.assignedUser._id;
        tmpl.data.onRemoveUser(userId);
    }
});