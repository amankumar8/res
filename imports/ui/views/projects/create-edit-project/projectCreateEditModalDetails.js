import './projectCreateEditModalDetails.html';

import {Projects} from "../../../../api/projects/projects";

Template.projectCreateEditModalDetails.onRendered(function() {
    this.$('input').characterCounter();
});

Template.projectCreateEditModalDetails.helpers({
    getDescription() {
        const project = Projects.findOne(Template.instance().data.projectId, {fields: {description: 1}});
        return project && project.description
    }
});

