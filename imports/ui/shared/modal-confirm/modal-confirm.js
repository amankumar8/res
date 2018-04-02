import './modal-confirm.html';

import { VZ } from '/imports/startup/both/namespace';
// Renders modal.
/*
 @params
 message - string
 onConfirm - function to run onConfirm
 onCancel - function to run onCancel
 */


VZ.UI.confirmModal = function (params) {
    let parentNode = $('body')[0];
    Blaze.renderWithData(Template.modalConfirm, params, parentNode);
};

Template.modalConfirm.onRendered(function () {
    let self = this;

    this.$('#modalConfirm').modal();
    this.$('#modalConfirm').modal('open');

    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });

});

Template.modalConfirm.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.modalConfirm.events({
    'click .confirm': function (e, template) {
        e.preventDefault();
        if (template.data.onConfirm) {
            template.data.onConfirm();
        }
        removeTemplate(template.view);
    },
    'click .cancel': function (e, template) {
        e.preventDefault();
        if (template.data.onCancel) {
            template.data.onCancel();
        }
        removeTemplate(template.view);
    }

});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};

