import { VZ } from '/imports/startup/both/namespace';
import { editBiography } from '/imports/api/users/methods';
import './edit-bio-modal.html';

Template.editBioModal.onCreated(function () {
});
Template.editBioModal.onRendered(function () {
    let self = this;
    this.$('.modal').modal();
    this.$('.modal').modal('open');
    this.$('#your-bio').trigger('autoresize');

    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
});
Template.editBioModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.editBioModal.helpers({

});

Template.editBioModal.events({
    'click .cancel': function (event, tmpl) {
        event.preventDefault();
        tmpl.$('#edit-bio-modal').modal('close');
        removeTemplate(tmpl.view);
    },
    'click .save': function (event, tmpl) {
        event.preventDefault();
        let bio = tmpl.$('#your-bio').val();
        editBiography.call({biography: bio}, function (err, res) {
            if (err) {
                VZ.notify('Failed');
            }
        });
        tmpl.$('#edit-bio-modal').modal('close');
        removeTemplate(tmpl.view);
    }
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};