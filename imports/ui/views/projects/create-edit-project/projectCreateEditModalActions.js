import './projectCreateEditModalActions.html';
import {createProject, updateProject, deleteProjectFile} from '/imports/api/projects/methods';
import {VZ} from '/imports/startup/both/namespace';

Template.projectCreateEditModalActions.events({
  'click #save': _.debounce(function (event, template) {
    event.preventDefault();
    event.stopPropagation();

    if (template.data.modalTemplate.data && template.data.modalTemplate.data.asideTemplateData && template.data.modalTemplate.data.asideTemplateData.projectId) {
      const modal = template.data.modalTemplate;
      const name = document.getElementById('titleProjectModal').value.trim();
      const description = document.getElementById('descriptionProjectModal').value.trim();
      const company = modal.currentCompanyVar.get();
      let tags = modal.tags.get();
      let selectedProjectKey = document.getElementById('project-key-modal').value.trim();
      let project = {};
      project.name = name;
      project.projectKey = selectedProjectKey;

      if (_.keys(company).length > 0) {
        project.companyId = company._id;
      }

      if (description) {
        project.description = description;
      }
      if (tags) {
        project.tags = tags;
      }
      project._id = template.data.modalTemplate.data.asideTemplateData.projectId;
      updateProject.call({project: project, projectKey: project.projectKey, projectFiles: []}, (err, res) => {
        if (err) {
          let message = err.reason || err.message;
          VZ.notify(message);
        } else {
          VZ.notify('Successfully updated!');
          $('.modal').modal('close');
          Blaze.remove(template.view);
        }
      });
    } else {
      const modal = template.data.modalTemplate;
      const name = document.getElementById('titleProjectModal').value.trim();
      const description = document.getElementById('descriptionProjectModal').value.trim();
      const company = modal.currentCompanyVar.get();
      let tags = modal.tags.get();
      let selectedProjectKey = document.getElementById('project-key-modal').value.trim();
      let user = Meteor.user();
      let project = {};
      project.budget = 1;
      project.name = name;
      project.projectKey = selectedProjectKey;
      if (_.keys(company).length > 0) {
        project.companyId = company._id;
      }
      else if(_.keys(company).length === 0 && user.profile && user.profile.selectedCompanyId){
        project.companyId = user.profile.selectedCompanyId;
      }
      if (description) {
        project.description = description;
      }
      if (tags) {
        project.tags = tags;
      }

      createProject.call({project: project}, (err, res) => {
        if (err) {
          console.log(err);
          let message = err.reason || err.message;
          VZ.notify(message);
        } else {
          VZ.notify('Successfully created!');
          $('.modal').modal('close');
          Blaze.remove(template.view);
        }
      });
    }

  }, 1000)
});
