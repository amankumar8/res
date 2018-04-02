import {Meteor} from 'meteor/meteor';
import {Companies} from '/imports/api/companies/companies';
import {Projects} from "../../../../api/projects/projects";

import './projectCreateEditModalAside.html';
import './tags/create-edit-project-tags';


Template.projectCreateEditModalAside.onCreated(function () {
  const modal = this.data.modalTemplate;
  const project = Projects.findOne({_id: this.data.projectId}, {fields: {tags: 1, companyId: 1}});
  modal.currentCompanyVar = new ReactiveVar({});
  modal.tags = new ReactiveVar(project ? project.tags : false);

  this.autorun(() => {
    let data = Template.currentData();
    if (data.projectId) {
      let project = Projects.findOne({_id: data.projectId}, {fields: {tags: 1, companyId: 1}});
      if (project && project.companyId) {
        let sub = this.subscribe('companyById', project.companyId);
        if (sub.ready()) {
          let company = Companies.findOne({_id: project.companyId});
          modal.currentCompanyVar.set(company);
        }
      }
    }
  });
});

Template.projectCreateEditModalAside.onRendered(function () {
  $('select').material_select();
});

Template.projectCreateEditModalAside.helpers({
  companySearchParams() {
    const modal = Template.instance().data.modalTemplate;
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
        modal.currentCompanyVar.set(value);
      },
      value: modal.currentCompanyVar.get()
    };
  },
  onReactiveVarSet() {
    let tmpl = Template.instance();
    return function (tags) {
      tmpl.data.modalTemplate.tags.set(tags);
    }
  },
  tags() {
    return Template.instance().data.modalTemplate.tags.get();
  },
  getKeys() {
    const project = Projects.findOne(Template.instance().data.projectId);
    return project && project.projectKey
  },
  isCompanyAccount () {
    let userId = Meteor.userId();
    let currentUser = Meteor.users.findOne({_id: userId});
    return currentUser && currentUser.profile && currentUser.profile.selectedCompanyId;
  }
});

Template.projectCreateEditModalAside.events({
  'click .companySelector .filled-in': function (event, template) {
    template.data.modalTemplate.currentCompanyVar.set(event.target.id);
  },
});
