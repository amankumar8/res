
import './jobCreateEditModalAside.html';
import './annuallySalaryChooser'
import './monthlySalaryChooser.html'
import './fixedPriceSalaryChooser.html'
import './hourlySalaryChooser.html'
import {Jobs} from '/imports/api/jobs/jobs';
import {Companies} from '/imports/api/companies/companies';
import {Positions} from '/imports/api/positions/positions';
import {Industries} from '/imports/api/industries/industries';

Template.jobCreateEditModalAside.onCreated(function () {
  const modal = this.data.modalTemplate;
  const job = Jobs.findOne({_id: this.data.jobId}, {fields: {companyId: 1, salary: 1, ownerId: 1, positionId: 1, categoryId: 1}});
    let company = '';
  if (job && job.companyId) {
      company = Companies.findOne({ _id: job.companyId }, { fields: { name: 1 } });
  }
  if (Meteor.user().profile.selectedCompanyId && !job) {
    company = Companies.findOne({ _id: Meteor.user().profile.selectedCompanyId }, { fields: { name: 1 } });
  }
    modal.currentCompanyVar = new ReactiveVar(company);
  modal.currentOwnerVar = new ReactiveVar((job && job.ownerId) || Meteor.userId());
  modal.currentSalaryTypeVar = new ReactiveVar(job && job.salary.type);
  modal.currentCategoryVar = new ReactiveVar(job && job.categoryId);
  modal.currentPositionVar = new ReactiveVar(job && job.positionId);
});

Template.jobCreateEditModalAside.helpers({
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
  companyCountry() {
    const companyId = Template.instance().data.modalTemplate.currentCompanyVar.get();
    const company = Companies.findOne(companyId, {fields: {location: 1}});
    return company && company.location.country;
  },
  isContractTypeChecked(contractType) {
    const job = Jobs.findOne(Template.instance().data.jobId, {fields: {contractType: 1}});
    return job && job.contractType === contractType;
  },
  isSalaryTypeChecked(salaryType) {
    const job = Jobs.findOne(Template.instance().data.jobId, {fields: {salary: 1}});
    return job && job.salary.type === salaryType;
  },
  getTemplateAccordingToSalaryType() {
    const salaryType = Template.instance().data.modalTemplate.currentSalaryTypeVar.get();
    if (salaryType === "Annual") {
      return 'annuallySalaryChooser';
    } else if (salaryType === "Monthly") {
      return 'monthlySalaryChooser';
    } else if (salaryType === "Hourly") {
      return 'hourlySalaryChooser';
    } else if (salaryType === "Fixed-price") {
      return 'fixedPriceSalaryChooser';
    }
  },
  getSalary() {
    const job = Jobs.findOne(Template.instance().data.jobId, {fields: {salary: 1}});
    return job && job.salary;
  },
  getEquity() {
    const job = Jobs.findOne(Template.instance().data.jobId, {fields: {equity: 1}});
    return job && job.equity;
  },
  categorySearchParams() {
    return {
      collection: Industries,
      collectionFilter: {isArchived: false},
      queryFieldName: 'name',
      fieldAccessor: 'name',
      buttonName: 'Select category',
      class: 'categorySelector',
      value: Industries.findOne(Template.instance().data.modalTemplate.currentCategoryVar.get(), {fields: {name: 1}})
    }
  },
  positionSearchParams() {
    return {
      collection: Positions,
      collectionFilter: {isArchived: false},
      queryFieldName: 'name',
      fieldAccessor: 'name',
      buttonName: 'Select position',
      class: 'positionSelector',
      value: Positions.findOne(Template.instance().data.modalTemplate.currentPositionVar.get(), {fields: {name: 1}})
    }
  },
  isUserUnderCompany() {
    let tmpl = Template.instance();
    return Meteor.user() && Meteor.user().profile && Meteor.user().profile.selectedCompanyId && !tmpl.data.jobId;
  }
});

Template.jobCreateEditModalAside.events({
  'click .companySelector .filled-in': function (event, template) {
    template.data.modalTemplate.currentCompanyVar.set(event.target.id);
  },
  'click .categorySelector .filled-in': function (event, template) {
    template.data.modalTemplate.currentCategoryVar.set(event.target.id);
  },
  'click .positionSelector .filled-in': function (event, template) {
    template.data.modalTemplate.currentPositionVar.set(event.target.id);
  },
  'click [name="salary-type"]': function (event, template) {
    template.data.modalTemplate.currentSalaryTypeVar.set(event.target.value);
  }
});
