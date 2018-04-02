import { VZ } from '/imports/startup/both/namespace';
import { Skills } from '/imports/api/skills/skills.js';
import './edit-profile-modal.html';

Template.editProfileModal.onCreated(function () {
    this.location = new ReactiveVar(null);
    this.searchString = new ReactiveVar('');
    this.skillsObject = new ReactiveVar({});
    this.skillsArray = new ReactiveVar([]);
    this.isReady = new ReactiveVar(false);

    this.getNormalLocation = (geoObj) => {
        let result = {};

        result.coordinates = typeof(geoObj.geometry.location.lat) === 'function'
            ? {lat: geoObj.geometry.location.lat(), lng: geoObj.geometry.location.lng()}
            : {lat: geoObj.geometry.location.lat, lng: geoObj.geometry.location.lng};


        _.each(geoObj.address_components, function (component) {
            result[component.types[0]] = component.long_name;
        });

        return result
    };
    this.transformSkills = (skills) => {
        let nullArray = [];
        let labelArray = _.map(skills, function (skill) {
            return skill.label.toString();
        });
        _.each(labelArray, function (label) {
            nullArray.push(null);
        });
        let skillsObject = _.object(labelArray, nullArray);
        this.skillsObject.set(skillsObject);
    };

    this.autorun(() => {
        let searchString = this.searchString.get();
        let sub = this.subscribe('userSkillsByRegEx', searchString);
        if(sub.ready()){
            this.isReady.set(true);
        }
    });
    this.autorun(() => {
        let ready = this.isReady.get();
        if(ready){
            if(Meteor.user().profile && Meteor.user().profile.skills && Meteor.user().profile.skills.length > 0){
                let userSkills = Skills.find({_id: {$in: Meteor.user().profile.skills}}).fetch();
                let skillsArrayValue = _.map(userSkills, function (skill) {
                    return {tag: skill.label};
                });
                this.skillsArray.set(skillsArrayValue);
            }
        }
    });
    this.autorun(() => {
        let searchString = this.searchString.get();
        let searchParams = {};
        if (searchString != '') {
            let searchStringRegExp = new RegExp(searchString, 'ig');
            searchParams.label = {$regex: searchStringRegExp};
        } else {
            searchParams.label = 'no-skill';
        }
        let skills = Skills.find(searchParams).fetch();
        this.transformSkills(skills);
    });
});
Template.editProfileModal.onRendered(function () {
    let self = this;
    this.$('.modal').modal();
    this.$('.modal').modal('open');
    this.$('select').material_select();

    this.autorun(() => {
        let skillsObject = this.skillsObject.get();
        let searchString = this.searchString.get();
        let skillsArray = this.skillsArray.get();
        this.$('.chips-autocomplete').material_chip({
            data: skillsArray,
            autocompleteOptions: {
                data: skillsObject,
                limit: 5,
                minLength: 1
            },
            placeholder: 'Skills',
            secondaryPlaceholder: 'Skills'
        });
        this.$('.chips input').val(searchString);
        this.$('.chips input').focus();
    });

    this.$('.chips').on('chip.add', function(e, chip){
        let skillsArray = self.skillsArray.get();
        function isEqual(element) {
            return element.tag == chip.tag;
        }
        let index = skillsArray.findIndex(isEqual);
        if(index == -1){
            skillsArray.push(chip);
        }
    });

    this.$('.chips').on('chip.delete', function(e, chip){
        let skillsArray = self.skillsArray.get();
        function isEqual(element) {
            return element.tag == chip.tag;
        }
        let index = skillsArray.findIndex(isEqual);
        if(index != -1){
            skillsArray.splice(index, 1);
        }
    });
    GoogleMaps.load({
        v: '3', key: Meteor.settings.public.MAPS_API_KEY, libraries: 'geometry,places',
        language: 'en'
    });
    if (Meteor.user().profile && Meteor.user().profile.location) {
        let location = Meteor.user().profile.location;
        this.location.set(location);
    }
    this.autorun(() => {
        if (GoogleMaps.loaded()) {
            this.$('#location').geocomplete().bind('geocode:result', function (e, res) {
                self.location.set(self.getNormalLocation(res));
            });
        }
    });
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
});
Template.editProfileModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.editProfileModal.helpers({
    formatSkills(skills) {
        return skills.toString().replace(/,/g, ', ');
    },

    isSelected(availability) {
        let userAvailability = Template.instance().data.profile.availabilityTime;
        return userAvailability == availability ? 'selected' : '';
    },

    isChecked() {
        let getInvitations = Template.instance().data.profile.getInvitations;
        return getInvitations == true ? 'checked' : '';
    }
});

Template.editProfileModal.events({
    'click .save': function (event, tmpl) {
        event.preventDefault();

        let firstName = tmpl.$('#first-name').val().trim();
        let lastName = tmpl.$('#last-name').val().trim();
        let overview = tmpl.$('#overview').val().trim() || '';
        let location = tmpl.location.get();
        let skills = tmpl.$('.chips-autocomplete').material_chip('data');
        let skillsTags = _.map(skills, function (skill) {
            return skill.tag;
        });

        let hourlyRate = parseInt(tmpl.$('#hourly-rate').val().trim());
        let availabilityTime = tmpl.$('#availability').val().trim();
        let getInvitations = tmpl.$('#get-invitations').prop('checked');
        if (_.isEmpty(firstName) || _.isEmpty(lastName) || _.isEmpty(overview) || _.isEmpty(location) || _.isEmpty(skills) || hourlyRate < 0 || _.isEmpty(availabilityTime)) {
            $('.toast').hide();

            VZ.notify('Complete all fields', 5000);
            return;
        }

        let user = {
            firstName: firstName,
            lastName: lastName,
            overview: overview,
            location: location,
            skills: skillsTags,
            hourlyRate: hourlyRate,
            availabilityTime: availabilityTime,
            getInvitations: getInvitations
        };

        tmpl.data.onUserEdit(user);
        tmpl.$('#edit-profile-modal').modal('close');
        removeTemplate(tmpl.view);
    },
    'click .cancel': function (event, tmpl) {
        event.preventDefault();
        tmpl.$('#edit-profile-modal').modal('close');
        removeTemplate(tmpl.view);
    },
    'input .chips': _.throttle(function (event, tmpl) {
        event.preventDefault();
        let searchString = event.target.value.trim();
        tmpl.searchString.set(searchString);
    }, 300)
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};