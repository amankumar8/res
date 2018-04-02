import './create-edit-project.html';
import './tags/create-edit-project-tags';
import { VZ } from '/imports/startup/both/namespace';
import { Companies } from '/imports/api/companies/companies';
import { createProject, updateProject, deleteProjectFile } from '/imports/api/projects/methods';
import { uploadProjectFile } from '/imports/api/google-services/google-api/methods';

import Dropzone from 'dropzone/dist/dropzone';

Template.createEditProject.onCreated(function () {
    let tags = this.data && this.data.project ? this.data.project.tags : [];
    let companyId = this.data.project ? this.data.project.companyId : '';
    this.tags = new ReactiveVar(tags);
    this.projectFiles = new ReactiveVar([]);
    this.selectedCompanyId = new ReactiveVar(companyId);
    this.autorun(() => {
        this.subscribe('companyById', this.selectedCompanyId.get());
    });
});

Template.createEditProject.onRendered(function () {
    let self = this;
    let projectFiles = [];
    Dropzone.autoDiscover = false;

    let dropzone = new Dropzone('form#createEditProjectForm', {
        url: "/target-url",
        addRemoveLinks: true,
        maxFiles: 5,
        maxFilesize: 5,
        parallelUploads: 10,
        clickable: false,
        dictDefaultMessage: '',
        previewsContainer: '.dropzone-previews',
        dictFileTooBig: 'File is to big ({{filesize}}MiB) and will not be uploaded! Max filesize: {{maxFilesize}}MiB.',
        dictMaxFilesExceeded: 'Can\'t add more than 5 files in a time',

        accept: function (file, done) {
            let reader = new FileReader();
            reader.onload = function (event) {
                let uploadData = {};
                let data = new Uint8Array(reader.result);
                uploadData.data = data;
                uploadData.name = file.name;
                uploadData.type = file.type;
                uploadData.size = file.size;
                uploadData.perms = 'publicRead';
                projectFiles.push(uploadData);
                self.projectFiles.set(projectFiles);
            };
            reader.readAsArrayBuffer(file);
            done();
        }

    });
    dropzone.on('maxfilesexceeded', function (file) {
        VZ.notify('Max upload  5 files in a time');
        dropzone.removeFile(file);
    });

    dropzone.on('removedfile', function (file) {
        if (file.status == 'success') {
            projectFiles = _.reject(projectFiles, function (currentFile) {
                return file.name == currentFile.name;
            });
            self.projectFiles.set(projectFiles);
        }
    });
});

Template.createEditProject.onDestroyed(function () {
});

Template.createEditProject.helpers({
    formTitle() {
        if (this && this.project) {
            return 'Edit project';
        }
        return 'Create project';
    },
    tags() {
        return Template.instance().tags.get();
    },
    onReactiveVarSet() {
        let tmpl = Template.instance();
        return function (tags) {
            tmpl.tags.set(tags);
        }
    },
    assignedUsers() {
        return Template.instance().assignedUsers.list();
    },
    availableCompaniesIds() {
        let companiesWhereUserIsManager = Roles.getGroupsForUser(Meteor.userId(), 'company-manager');
        let companiesWhereUserIsAdmin = Roles.getGroupsForUser(Meteor.userId(), 'company-owner');

        return _.union(companiesWhereUserIsAdmin, companiesWhereUserIsManager);
    },
    onCompanySelectCb() {
        let tmpl = Template.instance();
        return function (companyId) {
            tmpl.selectedCompanyId.set(companyId);
        }
    },
    selectedCompany() {
        let companyId = Template.instance().selectedCompanyId.get();
        let company = Companies.findOne(companyId);
        // console.log(company);
        return company ? company : {};
    }
});

Template.createEditProject.events({
    'click #cancel-button': function (event, tmpl) {
        event.preventDefault();
        Router.go('projects');
    },

    'submit #createEditProjectForm': _.debounce(function (event, tmpl) {
        event.preventDefault();
        event.stopPropagation();
        let selectedProjectKey = tmpl.$('#project-key').val().trim();
        let companyId = tmpl.selectedCompanyId.get();
        let projectFiles = tmpl.projectFiles.get() || [];
        let getProjectDocument = function () {

            let name = tmpl.$('#name').val().trim();
            let description = tmpl.$('#description').val().trim();
            let tags = tmpl.tags.get();

            let project = {};
            project.budget = 0;
            project.name = name;
            project.projectKey = selectedProjectKey;
            if(companyId){
              project.companyId = companyId;
            }

            if (description) {
                project.description = description;
            }
            if (tags) {
                project.tags = tags;
            }

            return project;
        };
        tmpl.$('#submit-form-button').attr('disabled', 'disabled');

        let project = getProjectDocument();
        if (projectFiles.length > 0) {
            VZ.notify('Uploading files');
        }
        if (tmpl.data && tmpl.data.project) {
            project._id = tmpl.data.project._id;
            project.assignedUsersIds = tmpl.data.project.assignedUsersIds;
            project.projectKey = tmpl.data.project.projectKey;
            uploadProjectFile.call({filesToUpload: projectFiles}, function (error, result) {
                if (result) {
                    updateProject.call({project:project, projectKey:selectedProjectKey, projectFiles:result}, (err, res) => {
                        if (err) {
                            let message = err.reason || err.message;
                            VZ.notify(message);
                            tmpl.$('#submit-form-button').removeAttr('disabled');
                        } else {
                            VZ.notify('Successfully updated!');
                            Router.go('projects');
                        }
                    });
                }
                else if (error) {
                    VZ.notify(error);
                }
            });

        } else {
          uploadProjectFile.call({filesToUpload: projectFiles}, function (error, result) {
                if (result) {
                    project.projectFiles = result;
                    createProject.call({ project: project }, (err, res) => {
                        if (err) {
                            let message = err.reason || err.message;
                            VZ.notify(message);
                            tmpl.$('#submit-form-button').removeAttr('disabled');
                        } else {
                            VZ.notify('Successfully created!');
                            Router.go('projects');
                        }
                    });
                }
                else if (error) {
                    VZ.notify(error);
                }
            });
        }
    }, 1000, true),

    'click .delete-file': function (event, tmpl) {
        event.preventDefault();
        let fileName = this.fileName;
        deleteProjectFile.call({projectId:tmpl.data.project._id, fileName:fileName}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                VZ.notify(message);
            } else {
                VZ.notify('Deleted');
            }
        });
    }
});
