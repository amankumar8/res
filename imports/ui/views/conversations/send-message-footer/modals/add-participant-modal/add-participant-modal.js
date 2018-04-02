import './add-participant-modal.html';

Template.addParticipantModal.onCreated(function () {
    let self = this;

    this.closeModal = () => {
        this.$('.modal').modal('close');
        setTimeout(function () {
            Blaze.remove(self.view);
        }, 500);
    }
});

Template.addParticipantModal.onRendered(function () {
    this.$('.modal').modal();
    this.$('.modal').modal('open');

    let self = this;
    $('.modal-overlay').on('click', function () {
        self.closeModal();
    });
});

Template.addParticipantModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.addParticipantModal.helpers({
    addParticipantOnActionCbs() {
        let tmpl = Template.instance();
        return {
            onAdd: function () {
                tmpl.closeModal();
            },
            onCancel: function () {
                tmpl.closeModal();
            }
        }
    }
});

Template.addParticipantModal.events({});