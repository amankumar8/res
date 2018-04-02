import { VZ } from '/imports/startup/both/namespace';
import { Teams } from '/imports/api/teams/teams';
import { assignTeamToProject, assignTeamToCompany } from '/imports/api/teams/methods';

import './assign-team-to-project-or-company.html';

Template.assignTeamToProjectOrCompany.onCreated(function () {
    this.DEFAULT_LIMIT = 10;

    let entityId = this.data.project
        ? this.data.project._id
        : this.data.company._id;
    let assignedTeams = Teams.find({
        $or: [
            {assignedProjectId: entityId},
            {assignedCompanyId: entityId}
        ]
    }).fetch();
    let assignedTeamsIds = _.map(assignedTeams, function (team) {
        return team._id;
    });

    this.assignedTeamsIds = new ReactiveArray(assignedTeamsIds);
    this.teamsLimit = new ReactiveVar(this.DEFAULT_LIMIT);

    this.autorun(() => {
        this.subscribe('Teams', {visibility: 'all'}, {limit: this.teamsLimit.get()});
    });
});

Template.assignTeamToProjectOrCompany.onRendered(function () {
});

Template.assignTeamToProjectOrCompany.onDestroyed(function () {
});

Template.assignTeamToProjectOrCompany.helpers({
    shouldDisplayLoadMoreButton() {
        let currentTeamsLimit = Template.instance().teamsLimit.get();
        return Teams.find().count() >= currentTeamsLimit;
    },

    teams() {
        let assignedTeamsIds = Template.instance().assignedTeamsIds.list().array();

        let query = {_id: {$nin: assignedTeamsIds}};
        query.$or = this.project ? [{assignedProjectId: {$exists: false}},
            {assignedProjectId: this.project._id}]
            : [{assignedCompanyId: {$exists: false}},
            {assignedCompanyId: this.company._id}];

        return Teams.find(query);
    },
    assignedTeams() {
        let assignedTeamsIds = Template.instance().assignedTeamsIds.list().array();
        return Teams.find({
            _id: {$in: assignedTeamsIds}
        });
    }
});

Template.assignTeamToProjectOrCompany.events({
    'click .assign-team-button': function (event, tmpl) {
        let assignedTeamsIds = tmpl.assignedTeamsIds.array();

        if (tmpl.data.project) {
            assignTeamToProject.call({projectId: tmpl.data.project._id, teamIds:assignedTeamsIds}, function (err) {
                if (err) {
                    VZ.notify(err.message);
                } else {
                    Router.go('projects');
                }
            });
        } else {
            assignTeamToCompany.call({companyId: tmpl.data.company._id, teamIds: assignedTeamsIds}, function (err) {
                if (err) {
                    VZ.notify(err.message);
                } else {
                    Router.go('companies');
                }
            });
        }
    },
    'click .cancel-button': function (event, tmpl) {
        if (tmpl.data.project) {
            Router.go('projects');
        } else {
            Router.go('companies');
        }
    },

    'click .team-for-assigning-icon': function (event, tmpl) {
        tmpl.assignedTeamsIds.push(event.target.id);
    },
    'click .assigned-team-item-icon': function (event, tmpl) {
        tmpl.assignedTeamsIds.remove(event.target.id);
    },

    'click .load-more-button': function (event, tmpl) {
        let newLimit = tmpl.DEFAULT_LIMIT + tmpl.teamsLimit.get();
        tmpl.teamsLimit.set(newLimit);
    }
});