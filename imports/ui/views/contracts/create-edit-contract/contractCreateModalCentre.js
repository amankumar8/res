import './contractCreateModalCentre.html'

import {Meteor} from 'meteor/meteor';
import {Companies} from '/imports/api/companies/companies';
import {VZ} from '/imports/startup/both/namespace';

import { Projects } from '/imports/api/projects/projects';
import { determineUserRole, getUserRole} from './helpers';
import { createContract } from '/imports/api/contracts/methods';

Template.contractCreateModalCentre.onCreated(function () {

    this.currentCompanyVar = new ReactiveVar({});
    this.tags = new ReactiveVar(false);

    this.currentWorkerVar = new ReactiveVar({});
    this.currentCompanyVar = new ReactiveVar({});
    this.currentProjectsVar = new ReactiveVar([]);
});

Template.contractCreateModalCentre.onRendered(function () {
    $('select').material_select();
    this.$('input').characterCounter();
    let self = this;

    this.$('.modal').modal();
    this.$('.modal').modal('open');
    $('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode === 27) {
            removeTemplate(self.view);
        }
    });
});

Template.contractCreateModalCentre.helpers({
    userSearchParams() {
        let tmpl = Template.instance();
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
                tmpl.currentWorkerVar.set(value);
            },
            value: tmpl.currentWorkerVar.get()
        };
    },
    companySearchParams() {
        let tmpl = Template.instance();
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
                tmpl.currentCompanyVar.set(value);
            },
            value: tmpl.currentCompanyVar.get()
        };
    },
    projectSearchParams() {
        let tmpl = Template.instance();
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
                tmpl.currentProjectsVar.set(value);
            },
            value: tmpl.currentProjectsVar.get() || []
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
        const tmpl = Template.instance();
        return tmpl.currentProjectsVar.get() || [];
    }
});

Template.contractCreateModalCentre.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.contractCreateModalCentre.events({
    'click .companySelector .filled-in': function (event, template) {
        template.currentCompanyVar.set(event.target.id);
    },
    'click #save': _.debounce(function (event, template) {
        event.preventDefault();
        event.stopPropagation();

        if (!document.getElementById('titleContractModalCentre')) {
            return;
        }
        const data = {
            name: $('#titleContractModalCentre').val().trim(),
            workerId: template.currentWorkerVar.get() && template.currentWorkerVar.get()._id,
            companyId: template.currentCompanyVar.get() && template.currentCompanyVar.get()._id,
            projectIds: template.currentProjectsVar.get().map(project => project._id),
            userRole: getUserRole(),
            paymentInfo: {
                weekHoursLimit: parseInt($('#week-hours-limit').val()),
                type:  $('#payment-type').val(),
                rate: parseFloat($('#payment-rate').val())
            }
        };

        createContract.call(data, (err, res) => {
            if (err) {
                console.error(err);
                VZ.notify(err.reason || err.message);
            } else {
                VZ.notify('Contract created successfully');
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