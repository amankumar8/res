export const Teams = new Mongo.Collection('vz-teams');
import { VZ } from '/imports/startup/both/namespace';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

VZ.UserRoles = VZ.UserRoles || {};
VZ.UserRoles.Teams = {};

VZ.UserRoles.Teams.userPositions = [{
    name: 'Manager',
    roles: ['team-member', 'team-manager'],
    propertyNameInCollection: 'membersIds',
    canBeAssignedBy: ['team-admin']
}, {
    name: 'Member',
    roles: ['team-member'],
    propertyNameInCollection: 'membersIds',
    canBeAssignedBy: ['team-admin', 'team-manager']
}];

Teams.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

Teams.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const TeamsSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    name: {
        type: String,
        min: 5,
        max: 50
    },
    description: {
        type: String,
        optional: true
    },
    ownerId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    membersIds: {
        type: [String],
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    isPrivate: {
        type: Boolean
    },
    archived: {
        type: Boolean,
        optional: true
    },
    assignedProjectId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    assignedCompanyId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    }
});