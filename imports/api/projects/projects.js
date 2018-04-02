export const Projects = new Mongo.Collection('vz-projects');
import { VZ } from '/imports/startup/both/namespace';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

VZ.UserRoles = VZ.UserRoles || {};
VZ.UserRoles.Projects = {};

VZ.UserRoles.Projects.userPositions = [{
    name: 'Manager',
    roles: ['project-worker', 'project-manager'],
    propertyNameInCollection: 'assignedUsersIds',
    canBeAssignedBy: ['project-admin']
}, {
    name: 'Worker',
    roles: ['project-worker'],
    propertyNameInCollection: 'assignedUsersIds',
    canBeAssignedBy: ['project-admin', 'project-manager']
}];

Projects.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

Projects.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const ProjectSchema = new SimpleSchema({
    _id: {
      type: String,
      optional: true
    },
    name: {
        type: String
    },

    createdAt: {
        type: Date,
        optional: true
    },

    ownerId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        min: 17,
        max: 17,
        optional: true
    },

    projectKey: {
        type: String,
        min: 1,
        max: 6
    },
    projectFiles: {
        type: [Object],
        optional: true
    },
    'projectFiles.$.fileName': {
        type: String
    },
    'projectFiles.$.mediaLink': {
        type: String
    },

    description: {
        type: String,
        optional: true,
        min: 5,
        max: 500
    },

    archived: {
        type: Boolean,
        optional: true
    },
    info: {
        type: Object,
        optional: true
    },
    'info.tasksCount': {
        type: Number
    },
    'info.tasksCompleted': {
        type: Number
    },
    'info.totalTrackedTime': {
        type: Number,
        optional: true
    },
    'info.totalContractedTime': {
        type: Number,
        optional: true
    },
    'info.totalEarned': {
        type: Number,
        decimal: true,
        optional: true
    },
    tags: {
        type: [String],
        optional: true
    },

    attachments: {
        type: [Object],
        optional: true
    },
    assignedUsersIds: {
        type: [String],
        optional: true
    },
    assignedTeamsIds: {
        type: [String],
        optional: true
    },
    activityMessagesIds: {
        type: [String],
        optional: true
    },
    updatedAt: {
        type: Date,
        optional: true
    },
    budget: {
        type: Number,
        min: 0,
        optional: true
    },
    companyId: {
        type: String,
        optional: true
    }
});
