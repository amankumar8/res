import './projectCreateEditModalHead.html';
import {Projects} from "../../../../api/projects/projects";

Template.projectCreateEditModalHead.onRendered(function() {
    this.$('input').characterCounter();
});

Template.projectCreateEditModalHead.helpers({
    getTitle() {
        const project = Projects.findOne(Template.instance().data.projectId, {fields: {name: 1}});
        return project && project.name
    }
});

