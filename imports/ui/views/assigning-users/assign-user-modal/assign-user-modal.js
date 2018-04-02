import './user-group-item(is not used now)/user-group-item';
import './assign-user-modal.html';

Template.assignUserModal.onCreated(function () {
    let self = this;
    this.removeTemplate = function () {
        setTimeout(function () {
            Blaze.remove(self.view);
        }, 500);
    };
});

Template.assignUserModal.onRendered(function () {
    this.$('.modal').modal();
    this.$('.modal').modal('open');
    let self = this;
    $('.modal-overlay').on('click', function () {
        self.removeTemplate();
    });
});

Template.assignUserModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.assignUserModal.helpers({
    isSelectedPosition(position) {
        let alreadyAssigned = Template.instance().data.assignedToUserPositions;
        return _.find(alreadyAssigned, function (assignedPosition) {
            return assignedPosition.name == position.name;
        });
    }
});

Template.assignUserModal.events({
    'click .assign-user-button': function (event, tmpl) {
        let selectedPositionName = tmpl.$('.user-position-radio:checked').val();
        let availablePositions = tmpl.data.userPositions;
        let selectedPosition = _.find(availablePositions, function (position) {
            return position.name == selectedPositionName;
        });

        tmpl.data.onAssignUser({_id:tmpl.data.userId, positions: [selectedPosition]});
        tmpl.$('#time-tracker-project-modal-picker').modal('close');
        tmpl.removeTemplate();
    }
});