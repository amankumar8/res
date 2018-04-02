/**
 * Created by andriimakar on 8/28/17.
 */
import {TimeEntries} from '/imports/api/timeEntries/timeEntries';
import {Screenshots} from '/imports/api/screenShots/screenShots';
import {Projects} from '/imports/api/projects/projects';
import {Tasks} from '/imports/api/tasks/tasks';
import {Conversations} from '/imports/api/conversations/conversations';
import {Messages} from '/imports/api/messages/messages';
import {VZ} from '/imports/startup/both/namespace';
import {ValidatedMethod} from 'meteor/mdg:validated-method';

export const resetDb = new ValidatedMethod({
    name: 'resetDb',
    validate: null,
    run() {
        if (Meteor.isServer) {
            Meteor.users.remove({});

            let activateAccount = function (userId) {
                let user = Meteor.users.find(userId).fetch()[0];

                if (user.emails && user.emails.length != 0) {
                    let emails = user.emails;
                    emails[0].verified = true;
                    Meteor.users.update({_id: userId}, {$set: {'emails': emails}})
                }
            };

            VZ.Server.DummyDocuments.users.admins.forEach(function (admin) {
                let userId = Accounts.createUser(admin);

                Roles.addUsersToRoles(userId, 'admin', Roles.GLOBAL_GROUP);
                activateAccount(userId);
            });

            VZ.Server.DummyDocuments.users.users.forEach(function (user) {
                let userId = Accounts.createUser(user);
                Roles.addUsersToRoles(userId, 'user', Roles.GLOBAL_GROUP);
                activateAccount(userId);
            });

            let users = Meteor.users.find().fetch();

            let createEntityWithAssignedUsers = function (params) {
                params.targetCollection.remove({});

                params.entities.forEach(function (entity) {
                    entity[params.adminPosition.targetPropertyName] = users[0]._id;

                    let entityId = params.targetCollection.insert(entity);

                    Roles.addUsersToRoles(entity[params.adminPosition.targetPropertyName], params.adminPosition.roles, entityId);

                    let workersIndexes = [];
                    for (let i = 1; i < users.length; i++) {
                        workersIndexes.push(i);
                    }
                    workersIndexes = _.shuffle(workersIndexes);

                    let updateQueryWithUsers = {};
                    params.usersPositions.forEach(function (userPosition, index) {
                        let userId = users[workersIndexes[index]]._id;
                        updateQueryWithUsers[userPosition.targetPropertyName] = updateQueryWithUsers[userPosition.targetPropertyName] || [];
                        updateQueryWithUsers[userPosition.targetPropertyName].push(userId);

                        Roles.addUsersToRoles(userId, userPosition.roles, entityId);
                    });
                    params.targetCollection.update(entityId, {$set: updateQueryWithUsers});
                });
            };

            createEntityWithAssignedUsers(VZ.Server.DummyDocuments.Projects);
            createEntityWithAssignedUsers(VZ.Server.DummyDocuments.Teams);

            Tasks.remove({});
            VZ.Server.DummyDocuments.Tasks.forEach(function (task) {
                task.ownerId = Meteor.users.findOne({'profile.fullName': 'Abraham Lincoln'})._id;
                let id = Tasks.insert(task);
                Roles.addUsersToRoles(task.ownerId, 'task-owner', id);
            });

            // create workplaces and add tools to each workplace

            let getRandomInt = (min, max) => {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            };

            TimeEntries.remove({});
            Screenshots.remove({});

            Meteor.users.find().forEach(function (user) {
                let userId = user._id;

                for (let i = 1; i < getRandomInt(0, 10); i++) {
                    let timeEntryStartMoment = moment().subtract(getRandomInt(1000, 10000), 'minutes');
                    let timeEntryEndMoment = moment(timeEntryStartMoment).add(getRandomInt(100, 1000),
                        'minutes');

                    let timeEntry = {
                        message: 'Time entry without project',
                        startDate: timeEntryStartMoment.toDate(),
                        endDate: timeEntryEndMoment.toDate(),
                        userId: userId,
                        _done: true,
                        _isManual: false,
                        _totalMinutes: timeEntryEndMoment.diff(timeEntryStartMoment, 'minutes'),
                        _isActive: false,
                        _initiatedByDesktopApp: false,
                        _trackedByDesktopApp: false
                    };

                    let projectsIdsWhereAdmin = Roles.getGroupsForUser(userId, 'project-admin');
                    let projectsIdsWhereManager = Roles.getGroupsForUser(userId, 'project-manager');
                    let projectsIdsWhereWorker = Roles.getGroupsForUser(userId, 'project-worker');

                    let projectsIds = _.union(projectsIdsWhereAdmin, projectsIdsWhereManager,
                        projectsIdsWhereWorker);

                    if (projectsIds.length > 0) {
                        let projectId = projectsIds[getRandomInt(0, projectsIds.length - 1)];
                        // console.log(projectsIds);
                        // console.log(projectId);
                        let projectName = Projects.findOne(projectId).name;
                        _.extend(timeEntry, {
                            message: projectName,
                            projectId: projectId
                        })
                    }

                    TimeEntries.insert(timeEntry);
                }
            });


            // create dummy conversations
            Conversations.remove({});
            Messages.remove({});
            Meteor.users.find().forEach(function (conversationOwner) {
                let participants = Meteor.users.find({_id: {$ne: conversationOwner._id}}).fetch();
                let participantsIds = _.map(participants, function (participant) {
                    return participant._id;
                });
                participantsIds = _.shuffle(participantsIds);
                participantsIds = participantsIds.slice(0, 3);

                let userId = conversationOwner._id;

                let conversationId = Conversations.insert({
                    title: conversationOwner.profile.firstName + '\'s conversation',
                    ownerId: userId,
                    participantsIds: participantsIds,
                    isPrivate: false
                });

                Roles.addUsersToRoles(userId, ['conversation-owner', 'conversation-member'], conversationId);
                Roles.addUsersToRoles(participantsIds, ['conversation-member'], conversationId);
            });
            return true;
        }
    }
});