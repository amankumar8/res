import './participants-list-modal.html';
import './participant-list-modal-item/participant-list-modal-item';


Template.participantsListModal.onCreated(function () {
    let self = this;

    this.closeModal = () => {
        this.$('.modal').modal('close');
        setTimeout(function () {
            Blaze.remove(self.view);
        }, 500);
    }
});

Template.participantsListModal.onRendered(function () {
    let self = this;

    this.$('#participants-list-modal').modal();
    this.$('#participants-list-modal').modal('open');

    $('.modal-overlay').on('click', function () {
        self.closeModal();
    });
});

Template.participantsListModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.participantsListModal.helpers({
    participants() {
        let participantsIds = this.conversation.participantsIds.slice(0);
        participantsIds.push(this.conversation.ownerId);

        return Meteor.users.find({
            _id: {
                $in: participantsIds,
                $ne: Meteor.userId()
            }
        });
    }
});

Template.participantsListModal.events({
    'click .close-modal-button': function (event, tmpl) {
        tmpl.closeModal();
    }
});