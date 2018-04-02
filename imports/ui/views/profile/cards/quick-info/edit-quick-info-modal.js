import { VZ } from '/imports/startup/both/namespace';
import './edit-quick-info-modal.html';

Template.editQuickInfoModal.onCreated(function () {
    let socialMedias = this.data.profile && this.data.profile.socialMedias ? this.data.profile.socialMedias : [];
    this.socialMedias = new ReactiveVar(socialMedias);
});

Template.editQuickInfoModal.onRendered(function () {
    let self = this;
    this.$('.modal').modal();
    this.$('.modal').modal('open');
    this.$('select').material_select();

    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
    this.autorun(() => {
        this.socialMedias.get();
        this.$('#social-media').val('');
        this.$('select').material_select();
    });

});
Template.editQuickInfoModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.editQuickInfoModal.helpers({
    socialMedias() {
        return Template.instance().socialMedias.get();
    },
    socialIcon(socialName) {
        return Template.instance().data.getSocialIconName(socialName);
    },
    disabledSocial(socialName) {
        let socialMedias = Template.instance().socialMedias.get();
        return !!_.where(socialMedias, {socialMediaName: socialName}).length;
    },
    formatLanguages(languages) {
       return languages.toString().replace(/,/g, ', ');
    }
});

Template.editQuickInfoModal.events({
    'click .remove-media': function (event, tmpl) {
        event.preventDefault();
        let obj = this;
        let arr = tmpl.socialMedias.get();
        arr = _.reject(arr, function (socialMedia) {
            return socialMedia.socialMediaName == obj.socialMediaName;
        });
        tmpl.socialMedias.set(arr);
    },
    'click .add-button': function (event, tmpl) {
        event.preventDefault();

        let socialMediaName = tmpl.$('#social-media').val();
        let socialMediaLink = tmpl.$('#social-media-url').val().trim();
        if(!socialMediaName){
            VZ.notify('Select social', 5000);
            return;
        }
        if(!socialMediaLink){
            VZ.notify('Provide link', 5000);
            return;
        }
        let weSiteRegEx = new RegExp('^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$');
        if(!weSiteRegEx.test(socialMediaLink)){
            VZ.notify('Enter correct url', 5000);
            return;
        }
        let socialMedia = {
            socialMediaName: socialMediaName,
            socialMediaLink: socialMediaLink
        };
        let arr = tmpl.socialMedias.get();
        arr.push(socialMedia);
        tmpl.socialMedias.set(arr);

    },
    'click .save': function (event, tmpl) {
        event.preventDefault();
        let languages = _.reject(tmpl.$('#languages').val().trim().split(/\s*,\s*/), function (skill) {
            return skill == '';
        });
        let personalWebsite = tmpl.$('#website-url').val().trim();
        let socialMedias = tmpl.socialMedias.get();

        if (_.isEmpty(languages) || _.isEmpty(personalWebsite) || socialMedias.length == 0) {
            $('.toast').hide();
            VZ.notify('Complete all fields', 5000);
            return;
        }
        let weSiteRegEx = new RegExp('^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$');
        if(!weSiteRegEx.test(personalWebsite)){
            VZ.notify('Enter correct website', 5000);
            return;
        }
        let user = {
            languages: languages,
            personalWebsite: personalWebsite,
            socialMedias: socialMedias
        };
        tmpl.data.onUserEdit(user);
        tmpl.$('#edit-quick-info-modal').modal('close');
        removeTemplate(tmpl.view);

    },
    'click .cancel': function (event, tmpl) {
        event.preventDefault();
        tmpl.$('#edit-quick-info-modal').modal('close');
        removeTemplate(tmpl.view);
    }

});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};