import './projectCreateModalCentre.html'
import './tags/create-edit-project-tags';

import {Meteor} from 'meteor/meteor';
import {Companies} from '/imports/api/companies/companies';
import {createProject} from '/imports/api/projects/methods';
import {VZ} from '/imports/startup/both/namespace';

Template.projectCreateModalCentre.onCreated(function () {

    this.currentCompanyVar = new ReactiveVar({});
    this.tags = new ReactiveVar(false);
});

Template.projectCreateModalCentre.onRendered(function () {
    $('select').material_select();
    this.$('input').characterCounter();
    let self = this;

    this.$('.modal').modal();
    this.$('.modal').modal('open');
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
});

Template.projectCreateModalCentre.helpers({
    companySearchParams() {
        const tmpl = Template.instance();
        return {
            collection: Companies,
            subscription: {
                name: 'companiesByNameRegExpAlternative',
                limit: 5,
                addQuery: {},
                addOptions: {},
            },
            dropdownAddOptions: {},
            queryFieldName: 'name',
            fieldAccessor: 'name',
            buttonName: 'Select company',
            placeholder: 'Enter company name',
            class: 'companySelector',
            setFunction(value) {
                tmpl.currentCompanyVar.set(value);
            },
            value: tmpl.currentCompanyVar.get()
        };
    },
    onReactiveVarSet() {
        let tmpl = Template.instance();
        return function (tags) {
            tmpl.tags.set(tags);
        }
    },
    tags() {
        return Template.instance().tags.get();
    },
    isCompanyAccount () {
        let userId = Meteor.userId();
        let currentUser = Meteor.users.findOne({_id: userId});
        return currentUser && currentUser.profile && currentUser.profile.selectedCompanyId;
    }
});

Template.projectCreateModalCentre.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.projectCreateModalCentre.events({
    'click .companySelector .filled-in': function (event, template) {
        template.currentCompanyVar.set(event.target.id);
    },
    'click #save': _.debounce(function (event, template) {
        event.preventDefault();
        event.stopPropagation();

        const name = document.getElementById('titleProjectModalCentre').value.trim();
        const description = document.getElementById('descriptionCentreModal').value.trim();
        const company = template.currentCompanyVar.get();
        let tags = template.tags.get();
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

    }, 1000)
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};