import { Teams, TeamsSchema } from './teams';
import { VZ } from '/imports/startup/both/namespace';
import { sendNotifications } from '/imports/api/notifications/methods';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { fillAssignedUsersMap, changeUserRoles, searchChanges } from '/imports/api/users/helper-functions';

export const createTeam = new ValidatedMethod({
    name: 'teams.createTeam',
    validate: new SimpleSchema({
        name: {
            type: String,
            min: 5,
            max: 50
        },
        isPrivate: {
            type: Boolean
        },
        description: {
            type: String,
            optional: true
        }
    }).validator(),
    run(team) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('teams.createTeam.notLoggedIn',
                'Must be logged in.');
        }
        team.ownerId = this.userId;
        team.createdAt = new Date();
        team.archived = false;

        let teamId = Teams.insert(team);
        Roles.addUsersToRoles(this.userId, 'team-admin', teamId);

        let user = Meteor.users.findOne({_id: this.userId});
        let notificationMsg = 'Team - ' + team.name + ' - added by ' + user.profile.fullName + ' -';
        sendNotifications.call({title: 'Team created', msg: notificationMsg, usersIdsArray: userId});
        return teamId;
    }
});

export const updateTeam = new ValidatedMethod({
    name: 'teams.updateTeam',
    validate: TeamsSchema.validator(),
    run(team) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('teams.updateTeam.notLoggedIn',
                'Must be logged in.');
        }
        let teamToUpdate = Teams.findOne(team._id);

        if (VZ.canUser('editTeam', this.userId, teamToUpdate._id)) {
            team = _.omit(team, '_id');
            Teams.update(team._id, {$set: team}, function (err) {
                if (err) {
                  throw new Meteor.Error('teams.updateTeam.updateFail', err.message);
                }
            });
        } else {
            throw new Meteor.Error('teams.updateTeam.permissionError', 'You can\'t edit this team!');
        }
    }
});

export const assignMembersToTeam = new ValidatedMethod({
    name: 'teams.assignMembersToTeam',
    validate: new SimpleSchema({
        teamId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        assignedUsersWithPositions: {
            type: [String]
        },
        assignedUsersWithPositionsBeforeChanges: {
            type: [String]
        }
    }).validator(),
    run({teamId, assignedUsersWithPositions,
        assignedUsersWithPositionsBeforeChanges}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('teams.assignMembersToTeam.notLoggedIn',
                'Must be logged in.');
        }
        let user = Meteor.users.findOne({_id: userId});
        let teamToUpdate = Teams.findOne(teamId);

        let userChanges = searchChanges(assignedUsersWithPositions, assignedUsersWithPositionsBeforeChanges);

        if (!teamToUpdate) {
            throw new Meteor.Error('Team does not exist!');
        }

        if (!VZ.canUser('assignUserToTeam', userId, teamToUpdate._id)) {
            throw new Meteor.Error('You\'re not allowed to assign members to this team!');
        }

        let availablePositions = VZ.UserRoles.Teams.userPositions;
        // check whether all changed positions can be updated by current user
        // and update roles after that
        changeUserRoles(teamId, assignedUsersWithPositionsBeforeChanges, assignedUsersWithPositions, availablePositions);

        // If user roles was updated - update company workers list
        let assignedUsersMap = fillAssignedUsersMap(assignedUsersWithPositions, availablePositions);
        Teams.update({_id: teamId}, {$set: assignedUsersMap});

        //----------------------NOTIFICATON SENDING---------------------
        let query = {};
        query['roles.' + teamId] = {$in: ['team-manager', 'team-admin']};
        let managersAndAdmins = Meteor.users.find(query).fetch();
        managersAndAdmins = _.map(managersAndAdmins, function (doc) {
            return doc._id;
        });

        //added users
        if (userChanges.addedUsers.length > 0) {
            _.each(userChanges.addedUsers, function (id) {
                let changedUser = Meteor.users.findOne({_id: id});
                let msgForBosses = 'Team member - ' + changedUser.profile.fullName + ' - added to Team ' + teamToUpdate.name + ' by ' + user.profile.fullName + ' -';
                let msgForUser = 'You have been assigned to Team ' + teamToUpdate.name + ' by ' + user.profile.fullName + ' -';
                sendNotifications.call({title: 'User assigned to team', msg: msgForBosses, usersIdsArray: managersAndAdmins});
                sendNotifications.call({title: 'Assigned to team', msg: msgForUser, usersIdsArray: id});
            });
        }

        //removed users
        if (userChanges.removedUsers.length > 0) {
            _.each(userChanges.removedUsers, function (id) {
                let changedUser = Meteor.users.findOne({_id: id});
                let msgForBosses = 'Team member - ' + changedUser.profile.fullName + ' - removed from Team ' + teamToUpdate.name + ' by ' + user.profile.fullName + ' -';
                let msgForUser = 'You have been removed from Team ' + teamToUpdate.name + ' by ' + user.profile.fullName + ' -';
                sendNotifications.call({title: 'User removed from team', msg: msgForBosses, usersIdsArray: managersAndAdmins});
                sendNotifications.call({title: 'Removed from team', msg: msgForUser, usersIdsArray: id});
            });
        }

        //changed users
        if (userChanges.changedUsers.length > 0) {
            _.each(userChanges.changedUsers, function (obj) {
                let changedUser = Meteor.users.findOne({_id: obj.id});
                let msgForBosses = 'Team member - ' + changedUser.profile.fullName + ' - from Team ' + teamToUpdate.name + ' ' + obj.privilege + ' privilege by ' + user.profile.fullName + ' - ';
                let msgForUser = 'Privilege ' + obj.privilege + ' in team ' + teamToUpdate.name + ' by ' + user.profile.fullName + ' -';
                sendNotifications.call({title: 'Changed privilege', msg: msgForBosses, usersIdsArray: teamToUpdate.ownerId});
                sendNotifications.call({title: 'Changed privilege', msg: msgForUser, usersIdsArray: obj.id});
            });
        }
    }
});

export const assignTeamToProject = new ValidatedMethod({
    name: 'teams.assignTeamToProject',
    validate: new SimpleSchema({
        projectId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        teamIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({projectId, teamIds}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('teams.assignTeamToProject.notLoggedIn',
                'Must be logged in.');
        }
        if (!VZ.canUser('assignTeamToProject', this.userId, projectId)) {
            throw new Meteor.Error('You can\'t assign team to this project!');
        }

        let teamWithAssignedProject = Teams.findOne({
            _id: {$in: teamIds},
            assignedProjectId: {$exists: true, $ne: projectId}
        });
        if (!!teamWithAssignedProject) {
            throw new Meteor.Error('Team ' + teamWithAssignedProject.name + ' has assigned project!');
        }

        let assignedTeamsIdsBefore = [];
        Teams.find({assignedProjectId: projectId}).forEach(function (team) {
            assignedTeamsIdsBefore.push(team._id);
        });
        let removedTeamsIds = _.difference(assignedTeamsIdsBefore, teamIds);

        Teams.update({_id: {$in: teamIds}},
            {$set: {assignedProjectId: projectId}}, {multi: true});
        Teams.update({_id: {$in: removedTeamsIds}},
            {$unset: {assignedProjectId: ''}}, {multi: true});

    }
});

export const assignTeamToCompany = new ValidatedMethod({
    name: 'teams.assignTeamToCompany',
    validate: new SimpleSchema({
        companyId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        teamIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({companyId, teamIds}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('teams.assignTeamToCompany.notLoggedIn',
                'Must be logged in.');
        }
        if (!VZ.canUser('assignTeamToCompany', this.userId, companyId)) {
            throw new Meteor.Error('You can\'t assign team to this company!');
        }

        let teamWithAssignedCompany = Teams.findOne({
            _id: {$in: teamIds},
            assignedCompanyId: {$exists: true, $ne: companyId}
        });
        if (!!teamWithAssignedCompany) {
            throw new Meteor.Error('Team ' + teamWithAssignedCompany.name + ' has assigned company!');
        }

        let assignedTeamsIdsBefore = [];
        Teams.find({assignedCompanyId: companyId}).forEach(function (team) {
            assignedTeamsIdsBefore.push(team._id);
        });
        let removedTeamsIds = _.difference(assignedTeamsIdsBefore, teamIds);

        Teams.update({_id: {$in: teamIds}},
            {$set: {assignedCompanyId: companyId}}, {multi: true});
        Teams.update({_id: {$in: removedTeamsIds}},
            {$unset: {assignedCompanyId: ''}}, {multi: true});
    }
});

export const archiveTeam = new ValidatedMethod({
    name: 'teams.archiveTeam',
    validate: new SimpleSchema({
        teamId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({teamId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('teams.archiveTeam.notLoggedIn',
                'Must be logged in.');
        }
        if (VZ.canUser('archiveTeam', this.userId, teamId)) {
            Teams.update(teamId, {
                $set: {
                    archived: true
                }
            });
            let team = Teams.findOne({_id: teamId});
            let user = Meteor.users.findOne({_id: this.userId});
            let notificationMsg = 'Team - ' + team.name + ' - archived by ' + user.profile.fullName + ' -';
            sendNotifications.call({title: 'Team archived', msg: notificationMsg, usersIdsArray: userId});
        } else {
            throw new Meteor.Error('teams.archiveTeam.permissionError', 'You can\'t archive this team!');
        }
    }
});

export const archiveTeams = new ValidatedMethod({
    name: 'teams.archiveTeams',
    validate: new SimpleSchema({
        teamIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({teamIds}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('teams.archiveTeams.notLoggedIn',
                'Must be logged in.');
        }
        for (let i=0; i < teamIds.length; i++) {
            if (VZ.canUser('archiveTeam', this.userId, teamIds[i])) {
                Teams.update({_id: teamIds[i]}, {
                    $set: {
                        archived: true
                    }
                });
            }
            else {
                let team = Teams.findOne({_id: teamIds[i]});
                throw new Meteor.Error('teams.archiveTeam.permissionError', 'You can\'t archive ' + team.name+ ' team!');
            }
        }
    }
});

export const restoreTeams = new ValidatedMethod({
    name: 'teams.restoreTeams',
    validate: new SimpleSchema({
        teamIds: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({teamIds}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('teams.restoreTeams.notLoggedIn',
                'Must be logged in.');
        }
        for (let i=0; i < teamIds.length; i++){
            if (VZ.canUser('restoreTeam', this.userId, teamIds[i])) {
                Teams.update({_id: teamIds[i]}, {
                    $set: {
                        archived: false
                    }
                });
            }
            else {
                let team = Teams.findOne({_id: teamIds[i]});
                throw new Meteor.Error('teams.archiveTeam.permissionError', 'You can\'t restore ' + team.name+ ' team!');
            }
        }
    }
});

export const restoreTeam = new ValidatedMethod({
    name: 'teams.restoreTeam',
    validate: new SimpleSchema({
        teamId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validator(),
    run({teamId}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('teams.restoreTeam.notLoggedIn',
                'Must be logged in.');
        }
        if (VZ.canUser('restoreTeam', this.userId, teamId)) {
            Teams.update(teamId, {
                $set: {
                    archived: false
                }
            });
            let team = Teams.findOne({_id: teamId});
            let user = Meteor.users.findOne({_id: this.userId});
            let notificationMsg = 'Team - ' + team.name + ' - restored by ' + user.profile.fullName + ' -';
            sendNotifications.call({title: 'Team restored', msg: notificationMsg, usersIdsArray: userId});
        } else {
            throw new Meteor.Error('permission-error', 'You can\'t restore this team!');
        }
    }
});