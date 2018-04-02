import './jobCreateModalCentre.html'
import { Skills } from '/imports/api/skills/skills';
import {Jobs} from "../../../../api/jobs/jobs";
import './workerLocationChooser';
import './skills-chip'

import {Meteor} from 'meteor/meteor';
import {Companies} from '/imports/api/companies/companies';
import {createProject} from '/imports/api/projects/methods';
import {createJob, editJob} from '/imports/api/jobs/methods';
import {VZ} from '/imports/startup/both/namespace';

Template.jobCreateModalCentre.onCreated(function () {

    this.isWorkerLocationRestrictedVar = new ReactiveVar(false);
    let company = '';
    if (Meteor.user().profile.selectedCompanyId) {
        company = Companies.findOne({ _id: Meteor.user().profile.selectedCompanyId }, { fields: { name: 1 } });
    }
    this.currentCompanyVar = new ReactiveVar(company);
    this.currentOwnerVar = new ReactiveVar(Meteor.userId());
    this.currentSalaryTypeVar = new ReactiveVar();
});

Template.jobCreateModalCentre.onRendered(function () {
    this.$('input').characterCounter();
    this.autorun(() => {
        this.subscribe('allSkills');
    });
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

Template.jobCreateModalCentre.helpers({
    getAllSkills() {
        return Skills.find().fetch();
    },
    isWorkerLocationRestricted() {
        return Template.instance().isWorkerLocationRestrictedVar.get();
    },
    isWorkerLocationRestrictionChosen(restricted) {
        const isRestricted = Template.instance().isWorkerLocationRestrictedVar.get();
        if (isRestricted === false) {
            return restricted === 'anywhere';
        } else if (isRestricted === true) {
            return restricted === 'restricted';
        }
    },

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
    getTemplateAccordingToSalaryType() {
        const salaryType = Template.instance().currentSalaryTypeVar.get();
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
        let salary;
        return salary;
    },
    isUserUnderCompany() {
        let tmpl = Template.instance();
        return Meteor.user() && Meteor.user().profile && Meteor.user().profile.selectedCompanyId && !tmpl.data.jobId;
    },
    getWorkerLocation() {
        const job = Jobs.findOne(Template.instance().data.jobId, {fields: {workerLocation: 1}});
        return job && job.workerLocation;
    },
});

Template.jobCreateModalCentre.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.jobCreateModalCentre.events({
    'click [name="workerLocation"]': function(event, template) {
        template.isWorkerLocationRestrictedVar.set(event.target.value === 'restricted');
    },
    'click [name="salary-type"]': function (event, template) {
        template.currentSalaryTypeVar.set(event.target.value);
    },
    'click #save': _.debounce(function (event, template) {
        event.preventDefault();
        event.stopPropagation();

        const title = document.getElementById('titleJobModalCentre').value.trim();
        const description = document.getElementById('descriptionCentreModal').value.trim();
        const ownerId = Meteor.userId();
        const user = Meteor.users.findOne({_id: Meteor.userId()});
        let companyId = user && user.profile && user.profile.selectedCompanyId;
        const contractType = getContractType(template);
        const salary = getSalaryAccordingToType(template);
        const skillsIds = getSkillsIds(template);
        const workerLocation = getWorkerLocation(template);
        const equity = +document.getElementById('equity').value;
        const data = {
            title,
            description,
            ownerId,
            companyId,
            contractType,
            salary,
            skillsIds,
            workerLocation,
            equity
            //positionId
        };
        createJob.call(data, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                VZ.notify(message);
            } else {
                VZ.notify('Job  ' + title + '  successfully created!');
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


function getContractType(template) {
    const contractTypeCheckedElements = Array.from(document.getElementsByName("contract-type")).filter(input => {
        return input.checked === true;
    });
    return contractTypeCheckedElements.length === 1 && contractTypeCheckedElements[0].value;
}

function getSalaryAccordingToType(template) {
    const currentSalaryType = template.currentSalaryTypeVar.get();
    if(currentSalaryType === 'Annual') {
        const salaryRangeElement = document.getElementById('annuallySalaryRange');
        const salaryRange = salaryRangeElement.noUiSlider.get();
        return {
            type: currentSalaryType,
            min: +salaryRange[0].replace('$',''),
            max: +salaryRange[1].replace('$','')
        }
    } else if(currentSalaryType === 'Monthly') {
        const monthlyRate = +parseFloat(document.getElementById('salaryMonthlyRate').value).toFixed(2);
        return {type: currentSalaryType, monthlyRate};
    } else if(currentSalaryType === 'Hourly') {
        const hourlyRate = +parseFloat(document.getElementById('salaryHourlyRate').value).toFixed(2);
        return {type: currentSalaryType, hourlyRate};
    } else if(currentSalaryType === 'Fixed-price') {
        const contractPrice = +parseFloat(document.getElementById('salaryFixedPrice').value).toFixed(2);
        return {type: currentSalaryType, contractPrice};
    } else if(currentSalaryType === 'Undisclosed') {
        return {type: currentSalaryType};
    }
}

function getSkillsIds(modal) {
    const skillsLabels = $('.chips').material_chip('data');
    return skillsLabels.map(label => {
        const skill = Skills.findOne({label: label.tag}, {fields: {_id: 1}});
        return skill && skill._id;
    });
}

function getWorkerLocation(template) {
    const workerLocationRestrictionCheckedElements = Array.from(document.getElementsByName("workerLocation")).filter(input => {
        return input.checked === true;
    });
    if(workerLocationRestrictionCheckedElements.length !== 1) {
        VZ.notify('worker location is required');
        throw 'worker location is required';
    }
    const isRestricted =  workerLocationRestrictionCheckedElements[0].value === 'restricted';
    if(isRestricted === true) {
        const continent = document.getElementById('continent').value;
        if(!continent) {
            VZ.notify('select continent');
            throw 'select continent';
        }
        const result = {
            isRestricted,
            continent
        };
        const notRestrictCountries = document.getElementById('notRestrictCountries').checked;
        if(notRestrictCountries === false) {
            const country = document.getElementById('country').value;
            if(!country) {
                VZ.notify('select country');
                throw 'select country';
            }
            return Object.assign(result, {country});
        } else {
            return result;
        }
    } else {
        return {isRestricted};
    }
}