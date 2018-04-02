import { VZ } from '/imports/startup/both/namespace';
import { createTeam, updateTeam } from '/imports/api/teams/methods';

import './create-edit-team.html';

Template.createEditTeam.onCreated(function () {
});

Template.createEditTeam.onRendered(function () {
});

Template.createEditTeam.onDestroyed(function () {
});

Template.createEditTeam.helpers({
    isPrivate() {
        return this.team && this.team.isPrivate;
    }
});

Template.createEditTeam.events({
    'submit #createEditTeamForm': _.throttle(function (event, tmpl) {
        let getTeamDocument = function () {

            let name = tmpl.$('#name').val().trim();
            let description = tmpl.$('#description').val().trim();

            let visibility = tmpl.$('[name="visibility"]:checked').val();

            let team = {};

            team.name = name;
            team.isPrivate = visibility == 'lib';

            if (description) {
                team.description = description;
            }
            return team;
        };

        event.preventDefault();
        tmpl.$('#submit-form-button').attr('disabled', 'disabled');

        let team = getTeamDocument();
        if (tmpl.data && tmpl.data.team) {
            team._id = tmpl.data.team._id;
            team.ownerId = tmpl.data.team.ownerId;
            team.membersIds = tmpl.data.team.membersIds;
            updateTeam.call(team, function (err) {
                if (err) {
                    VZ.notify(err);
                    tmpl.$('#submit-form-button').removeAttr('disabled');
                } else {
                    VZ.notify('Successfully updated!');
                    Router.go('teams', {visibility: 'public'});
                }
            });
        } else {
            createTeam.call(team, function (err) {
                if (err) {
                    VZ.notify(err);
                    tmpl.$('#submit-form-button').removeAttr('disabled');
                } else {
                    VZ.notify('Successfully created!');
                    Router.go('teams', {visibility: 'public'});
                }
            });
        }
    }, 1000)
});
