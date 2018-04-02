import './biography-card.html';

Template.biographyCard.onCreated(function () {
    this.showMore = new ReactiveVar(false);
    this.autorun(() => {
       Template.currentData();
    });

});

Template.biographyCard.onRendered(function () {
    this.autorun(() => {
        Template.currentData();
    });
});

Template.biographyCard.helpers({
    profileBiography() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile) {
            return;
        }
        if (user.profile.biography) {
            let biography = user.profile.biography;
            let new_text, small_len = 300;

            if (biography.length > 300 && !Template.instance().showMore.get()) {
                new_text = biography.substr(0, (small_len - 3)) + '...';
                return new_text;
            }
            return user.profile.biography;
        }
    },
    showMore() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile || !user.profile.biography) {
            return;
        }
        return user.profile.biography.length > 300 && Template.instance().showMore.get();
    },
    showMoreButton() {
        let user = Meteor.users.findOne({_id: Router.current().params.id});
        if (!user || !user.profile || !user.profile.biography) {
            return;
        }
        return user.profile.biography.length > 300;
    },
    profileOwner() {
        return isProfileOwner();
    }
});

Template.biographyCard.events({
    'click .edit-bio': function (event, tmpl) {
        event.preventDefault();
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        let profile = user && user.profile;
        let parentNode = $('body')[0],
            modalData = {
                profile: profile
            };
        Blaze.renderWithData(Template.editBioModal, modalData, parentNode);
    },
    'click .show-more': function (event, tmpl) {
        event.preventDefault();
        tmpl.showMore.set(true);
    },
    'click .show-less': function (event, tmpl) {
        event.preventDefault();
        tmpl.showMore.set(false);
    }
});

let isProfileOwner = () => {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (user) {
        return Meteor.userId() === user._id;
    }
    return false
};