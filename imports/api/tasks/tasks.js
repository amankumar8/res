import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {VZ} from '/imports/startup/both/namespace';

export const Tasks = new Mongo.Collection('vz-tasks');

VZ.UserRoles = VZ.UserRoles || {};
VZ.UserRoles.Tasks = {};

VZ.UserRoles.Tasks.userPositions = [{
  name: 'Member',
  roles: ['task-member'],
  propertyNameInCollection: 'membersIds',
  canBeAssignedBy: ['task-owner']
}];

Tasks.allow({
  insert: (userId, doc) => false,
  update: (userId, doc) => false,
  remove: (userId, doc) => false
});

Tasks.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});

export const TaskSchema = new SimpleSchema({
  name: {
    type: String,
    min: 3,
    max: 50
  },
  taskKey: {
    type: String,
    min: 2,
    max: 15
  },
  description: {
    type: String,
    min: 5,
    max: 5000,
    optional: true
  },
  tags: {
    type: [String],
    optional: true
  },
  status: {
    type: String,
    optional: true
  },
  projectId: {
    type: String
  },
  taskFiles: {
    type: [Object],
    optional: true
  },
  'taskFiles.$.fileName': {
    type: String,
    optional: true
  },
  'taskFiles.$.mediaLink': {
    type: String
  },
  'taskFiles.$.size': {
    type: Number,
    optional: true
  },
  'taskFiles.$.uploaded': {
    type: Date
  },
  'taskFiles.$.type': {
    type: String,
    optional: true
  },
  ownerId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  archived: {
    type: Boolean,
    optional: true
  },
  createdAt: {
    type: Date
  },
  editedAt: {
    type: Date
  },
  editedBy: {
    type: String
  },
  membersIds: {
    type: [String],
    regEx: SimpleSchema.RegEx.Id
  },
  sendToInReview: {
    type: String,
    optional: true
  },
  hardLimit: {
    type: Number,
    optional: true
  }
});
