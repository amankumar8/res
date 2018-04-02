import { Jobs } from '/imports/api/jobs/jobs';
import { Skills } from '/imports/api/skills/skills';
import { Countries } from '/imports/api/countries/countries';
import { Companies } from '/imports/api/companies/companies';
import './talent-details-modal.html';

Template.talentDetailsModal.onCreated(function () {
    this.autorun(() => {
        let data = Template.currentData();
        let profile = data.profile;
    });
});

Template.talentDetailsModal.onRendered(function () {
    let self = this;

    this.$('.modal').modal();
    this.$('.modal').modal('open');
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode === 27) {
            removeTemplate(self.view);
        }
    });
});

Template.talentDetailsModal.onDestroyed(function () {
    $('.lean-overlay').remove();
});

Template.talentDetailsModal.helpers({
    talentInfo(){
        let tmpl = Template.instance();
        return tmpl.data;
    },
    profile(){
        let user = this;
        if (user.data.profile) {
            let profile = user.data.profile;
            let data = {
                profilePhoto: profile.photo && profile.photo.small || '',
                fullName: profile.fullName,
                overview: profile.overview || '-',
                availabilityTime: profile.availability && profile.availabilityTime ? profile.availabilityTime : 'Not available',
                location: profile.location && profile.location.country && profile.location.locality && profile.location.locality + ', ' + profile.location.country || '-',
                hourlyRate: profile.hourlyRate && profile.hourlyRate + '/hr' || '-',
                skills: profile.skills && profile.skills.slice(0, 4) || [],
                biography: profile.biography || '',
            };
            return data;
        }
        else {
            return '';
        }
    },
    skillName(){
        let skillId = this.valueOf();
        let skill = Skills.findOne({_id: skillId});
        if (skill && skill.label) {
            return skill && skill.label;
        } else {
            return this.valueOf();
        }
    }
});

Template.talentDetailsModal.events({
    'click #follow, click #invite'(event, tmpl){
        event.preventDefault();
        if (!Meteor.userId()) {
            removeTemplate(tmpl.view);
            setTimeout(function () {
                Router.go('login');
            }, 500);
        }
    },
    'click #close-modal'(event, tmpl){
        event.preventDefault();
        removeTemplate(tmpl.view);
    },
    'click #hire': function(event, template) {
        ga('send', 'event', 'hire', 'vezio-jobs');
        return true;
    },
    'click #invite': function(event, template){
        ga('send', 'event', 'invite', 'vezio-jobs');
        return true;
    }
});

let removeTemplate = function (view) {
    setTimeout(function () {
        if(Router.current().route.getName() == 'talentSearch'){
            Router.go('talentSearch');
        }
        Blaze.remove(view);
    }, 500);
};
