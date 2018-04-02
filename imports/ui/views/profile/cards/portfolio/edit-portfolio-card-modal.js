import { VZ } from '/imports/startup/both/namespace';
import { updateThumbnail, insertPortfolioProject } from '/imports/api/userPortfolioProjects/methods';
import './edit-portfolio-card-modal.html';

Template.editPortfolioModal.onCreated(function () {
    this.loadingThumbnail= new ReactiveVar(false);
    let self = this;
    this.resizePhoto = function (file) {
        Resizer.resize(file, {
            width: 400,
            height: 400,
            cropSquare: true
        }, function (err, res) {
            if (err) {
                VZ.notify('Failed to format image. Try again');
            }
            else {
                self.uploadThumbnail(res);
            }
        });
    };
    this.uploadThumbnail = function (file) {
        let reader = new FileReader();
        reader.onload = function (event) {
            let buffer = new Uint8Array(reader.result);
            updateThumbnail.call({buffer: buffer, type: file.type, name: file.name}, function (err, res) {
                if (err) {
                    VZ.notify('Failed to load thumbnail');
                    self.$('.save').removeAttr('disabled');
                    self.loadingThumbnail.set(false);
                }
                else {
                    self.thumbnail = res;
                    self.loadingThumbnail.set(false);
                    self.$('.save').removeAttr('disabled');
                }

            });
        };
        reader.readAsArrayBuffer(file);
    };
});

Template.editPortfolioModal.onRendered(function () {
    let self = this;
    this.$('.modal').modal();
    this.$('.modal').modal('open');

    this.$('.datepicker').pickadate({
        selectMonths: true,
        selectYears: 15
    });
    this.$('textarea#project-description').characterCounter();
    this.$('#project-description').trigger('autoresize');
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });

    let createdAt = this.$('#project-creation-date').pickadate('picker');


    if (this.data.portfolioProject) {
        createdAt.set('select', this.data.portfolioProject.createdAt);
    }
    this.autorun(() => {
        Template.currentData();
    });
});

Template.editPortfolioModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.editPortfolioModal.helpers({
    formatSkills(languages) {
        return languages.toString().replace(/,/g, ', ');
    },
    loadingThumbnail() {
        return Template.instance().loadingThumbnail.get();
    }
});

Template.editPortfolioModal.events({
    'click .save': function (event, tmpl) {
        event.preventDefault();
        let projectTitle = tmpl.$('#project-title').val().trim();
        let projectUrl = tmpl.$('#project-url').val().trim();
        let skills = _.reject(tmpl.$('#skills').val().trim().split(/\s*,\s*/), function (skill) {
            return skill == '';
        });
        let projectDescription = tmpl.$('#project-description').val().trim();
        let pickerDate = tmpl.$('#project-creation-date').pickadate('picker');
        let projectCreationDate = new Date(pickerDate.get());

        let project = {
            projectTitle: projectTitle,
            projectUrl: projectUrl,
            skills: skills,
            projectDescription: projectDescription,
            createdAt: projectCreationDate
        };
        if (tmpl.data.portfolioProject) {
            let thumbnail = tmpl.thumbnail || tmpl.data.portfolioProject.projectThumbnail;
            project.projectThumbnail = thumbnail;
            tmpl.data.onPortfolioEdit(project, tmpl);
        }
        else {
            let thumbnail = tmpl.thumbnail;
            project.projectThumbnail = thumbnail;
            tmpl.data.onPortfolioInsert(project, tmpl);
        }
    },

    'click .cancel': function (event, tmpl) {
        event.preventDefault();
        tmpl.$('#edit-portfolio-modal').modal('close');
        removeTemplate(tmpl.view);
    },
    'change #thumbnail': function (event, tmpl) {
        event.preventDefault();
        let file = $(event.target).prop('files')[0];
        if (!photoValidation(file)) {
            return
        }
        tmpl.loadingThumbnail.set(true);
        tmpl.$('.save').attr('disabled', 'disabled');
        tmpl.resizePhoto(file);
    },
    'click .add-more': function (event, tmpl) {
        event.preventDefault();
        let projectTitle = tmpl.$('#project-title').val().trim();
        let projectUrl = tmpl.$('#project-url').val().trim();
        let skills = _.reject(tmpl.$('#skills').val().trim().split(/\s*,\s*/), function (skill) {
            return skill == '';
        });
        let projectDescription = tmpl.$('#project-description').val().trim();
        let pickerDate = tmpl.$('#project-creation-date').pickadate('picker');
        let projectCreationDate = new Date(pickerDate.get());

        let project = {
            projectTitle: projectTitle,
            projectUrl: projectUrl,
            skills: skills,
            projectDescription: projectDescription,
            createdAt: projectCreationDate
        };
        if (tmpl.data.portfolioProject) {
            let thumbnail = tmpl.thumbnail || tmpl.data.portfolioProject.projectThumbnail;
            project.projectThumbnail = thumbnail;
            insertPortfolioProject.call(project, function (error, result) {
                if (!error) {
                    VZ.notify('Success');
                    tmpl.$('#project-title').val('');
                    tmpl.$('#project-url').val('');
                    tmpl.$('#skills').val('');
                    tmpl.$('#project-description').val('');
                    tmpl.$('#project-creation-date').pickadate('picker').clear();
                    tmpl.$('#thumbnail').val('');
                    tmpl.$('#thumbnail-label').val('');

                }
                else {
                    VZ.notify(error.message.replace(/[[0-9]+]/gi, ''));
                }
            });
        }
        else {
            let thumbnail = tmpl.thumbnail;
            project.projectThumbnail = thumbnail;
            insertPortfolioProject.call(project, function (error, result) {
                if (!error) {
                    VZ.notify('Success');
                    tmpl.$('#project-title').val('');
                    tmpl.$('#project-url').val('');
                    tmpl.$('#skills').val('');
                    tmpl.$('#project-description').val('');
                    tmpl.$('#project-creation-date').pickadate('picker').clear();
                    tmpl.$('#thumbnail').val('');
                    tmpl.$('#thumbnail-label').val('');

                }
                else {
                    VZ.notify(error.message.replace(/[[0-9]+]/gi, ''));
                }
            });
        }

    }
});
let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};
let photoValidation = function (file) {
    if (!file) {
        return
    }
    if (file.size >= 5 * 1000000) {
        VZ.notify('File too large! Limit 5MB');
        $('#thumbnail').val('');
        return
    }
    let typeRegEx = /^image\/(jpeg|JPEG|png|PNG|gif|GIF|tif|TIF)$/;
    if (!typeRegEx.test(file.type)) {
        VZ.notify('Wrong file type! Allowed jpeg, png, gif, tif');
        $('#thumbnail').val('');
        return
    }

    return true
};