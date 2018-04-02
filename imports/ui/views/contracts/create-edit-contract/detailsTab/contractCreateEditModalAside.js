import { Meteor } from 'meteor/meteor';
import { Companies } from '/imports/api/companies/companies';
import { Projects } from '/imports/api/projects/projects';
import { getAllowedCompanyIds, determineUserRole } from '../helpers';

import './contractCreateEditModalAside.html';

Template.contractCreateEditModalAside.onCreated(function () {
  const modal = this.data.modalTemplate;

  modal.currentWorkerVar = new ReactiveVar({});
  modal.currentCompanyVar = new ReactiveVar({});
  modal.currentProjectsVar = new ReactiveVar([]);
  modal.areAsideVarsInitialized.set(true);

  this.autorun(() => {
    let data = Template.currentData();

      let projects = Projects.find({ _id: { $in: data.projectIds || [] } }, { fields: { name: 1 } }).fetch();
      let worker = Meteor.users.findOne({ _id: data.workerId }, { fields: { emails: 1, profile: 1 } });
      let company = Companies.findOne({ _id: data.companyId }, { fields: { name: 1 } });

      modal.currentWorkerVar.set(worker);
      modal.currentCompanyVar.set(company);
      modal.currentProjectsVar.set(projects);
  });
});

Template.contractCreateEditModalAside.onRendered(function () {
  $('select').material_select();
});

Template.contractCreateEditModalAside.helpers({
  userSearchParams() {
    let tmpl = Template.instance();
    const modal = tmpl.data.modalTemplate;
    return {
      collection: Meteor.users,
      subscription: {
        name: 'usersByNameOrEmailRegExpAlternative',
        limit: 50,
        addQuery: {},
        addOptions: { fields: { emails: 1, profile: 1 } }
      },
      queryFieldName: 'emails.address',
      fieldAccessor: 'emails[0].address',
      buttonName: 'Select worker',
      placeholder: 'Enter email',
      class: 'workerSelector',
      setFunction(value) {
        modal.currentWorkerVar.set(value);
      },
      value: modal.currentWorkerVar.get()
    };
  },
  companySearchParams() {
    let tmpl = Template.instance();
    const modal = tmpl.data.modalTemplate;
    return {
      collection: Companies,
      subscription: {
        name: 'companiesByNameRegExpAlternative',
        limit: 20,
        addQuery: {},
        addOptions: {},
      },
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
  projectSearchParams() {
    let tmpl = Template.instance();
    const modal = tmpl.data.modalTemplate;

    return {
      collection: Projects,
      subscription: {
        name: 'projectsByNameRegExpAlternative',
        limit: 300,
        addQuery: {},
        addOptions: { fields: { name: 1 }, sort: { name: -1 } }
      },
      subscriptionValue: {
        name: 'projectsList',
        query: { _id: { $in: tmpl.data.projectIds } },
        options: { limit: 300 }
      },
      queryFieldName: 'name',
      fieldAccessor: 'name',
      buttonName: 'Select projects',
      placeholder: 'Enter project name',
      class: 'projectSelector',
      setFunction(value) {
        modal.currentProjectsVar.set(value);
      },
      value: modal.currentProjectsVar.get() || []
    };
  },
  isUserRoleChecked(role) {
    const data = Template.instance().data;
    if (data && data._id) {
      const userRole = determineUserRole(data.workerId, data.projectIds);
      return userRole === role;
    }
    return false;
  },
  getHoursLimit() {
    const data = Template.instance().data;
    return data && data.paymentInfo && data.paymentInfo.weekHoursLimit;
  },
  isPaymentTypeSelected(type) {
    const data = Template.instance().data;
    return data && data.paymentInfo && data.paymentInfo.type === type;
  },
  getPaymentRate() {
    const data = Template.instance().data;
    return data && data.paymentInfo && data.paymentInfo.rate;
  },
  getCurrentProjects() {
    const modal = Template.instance().data.modalTemplate;
    return modal.currentProjectsVar.get() || [];
  }
});

