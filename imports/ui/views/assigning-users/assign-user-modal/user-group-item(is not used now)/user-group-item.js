import './user-group-item.html';

Template.userPositionItem.onCreated(function () {
});

Template.userPositionItem.onRendered(function () {
});

Template.userPositionItem.helpers({
    isAssigned(position) {
        // data of assignUserModal template
        let assignedPositions = Template.parentData(2).assignedToUserPositions;

        return !!_.find(assignedPositions, function (assignedPosition) {
            return assignedPosition.name == position.name;
        });
    }
});

Template.userPositionItem.events({
    'change .user-position-checkbox': function (event, tmpl) {
        let shouldBeRemoved = !event.target.checked;
        let position = tmpl.data.position;
        tmpl.data.onChangePosition(position, shouldBeRemoved);
    }
});