import { VZ } from '/imports/startup/both/namespace';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const UserPortfolioProjects = new Mongo.Collection('vz-user-portfolio-projects');

UserPortfolioProjects.allow({
    insert: (userId, doc) => false,
    update: (userId, doc) => false,
    remove: (userId, doc) => false
});

UserPortfolioProjects.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

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

export const PortfolioProjectsSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    projectTitle: {
        type: String,
        min: 3,
        max: 100
    },
    projectUrl: {
        type: String,
        regEx: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    },
    skills: {
        minCount: 1,
        type: [String]
    },
    projectThumbnail: {
        type: String
    },
    projectDescription: {
        type: String,
        min: 3,
        max: 300
    },
    createdAt: {
        type: Date
    }
});

PortfolioProjectsSchema.messages({

    "minString projectTitle": "[label] must be at least [min] characters",
    "maxString projectTitle": "[label] cannot exceed [max] characters",

    "required projectTitle": "Project title is required",

    "required projectUrl": "Project url is required",
    "regEx projectUrl": "Enter correct website",

    "minCount skills": "You must specify at least [minCount] skill",

    "required projectThumbnail": "Thumbnail required",

    "minString projectDescription": "[label] must be at least [min] characters",
    "maxString projectDescription": "[label] cannot exceed [max] characters",

    "required projectDescription": "Project decription is required",

    "required createdAt": "Date creation required"
});
