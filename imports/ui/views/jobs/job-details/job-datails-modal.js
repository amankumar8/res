import { Jobs } from '/imports/api/jobs/jobs';
import { Skills } from '/imports/api/skills/skills';
import { Countries } from '/imports/api/countries/countries';
import { Companies } from '/imports/api/companies/companies';
import './job-datails-modal.html';

Template.jobDetailsModal.onCreated(function () {
    this.getSalaryInfo = function (salary) {
        let salaryInfo;
        switch (salary.type) {
            case 'Fixed-price':
                salaryInfo = salary.contractPrice + '$' + ' Fixed price';
                break;
            case 'Hourly':
                salaryInfo = salary.hourlyRate + '$' + '/h';
                break;
            case 'Annual':
                salaryInfo = salary.min / 1000 + 'k' + '$' + '-' + salary.max / 1000 + 'k' + '$' + ' Annually';
                break;
            case 'Monthly':
                salaryInfo = salary.montlyRate + '$' + ' Monthly';
                break;
        }
        return salaryInfo;
    };
    this.autorun(() => {
        let data = Template.currentData();
        this.subscribe('company', data.job.companyId);
    });
    this.autorun(() => {
        let data = Template.currentData();
        this.applied = new ReactiveVar(data.job && data.job.applicantsIds && _.indexOf(data.job.applicantsIds, Meteor.userId()) != -1);
    });
});

Template.jobDetailsModal.onRendered(function () {
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

Template.jobDetailsModal.onDestroyed(function () {
    $('.lean-overlay').remove();
});

Template.jobDetailsModal.helpers({
    jobInfo(){
        let tmpl = Template.instance();
        return tmpl.data && tmpl.data.job;
    },
    workerLocation(){
        let tmpl = Template.instance();
        let job = tmpl.data && tmpl.data.job;
        let location;
        if (job) {
            if (job.workerLocation.isRestricted) {
                location = job.workerLocation.country !== 'anywhere' ? job.workerLocation.country : job.workerLocation.continent;
            }
            else {
                location = 'Anywhere';
            }
            return location;
        }
        else {
            return '-';
        }
    },
    skillsIds(){
        let tmpl = Template.instance();
        let job = tmpl.data && tmpl.data.job;
        return job.skillsIds || [];
    },
    applied(){
        let tmpl = Template.instance();
        return tmpl.applied.get();
    },
    skillName(){
        let skillId = this.valueOf();
        let skill = Skills.findOne({_id: skillId});
        return skill && skill.label;
    },
    applicantsCount(){
        return this.applicantsIds && this.applicantsIds.length;
    },
    companyInfo(){
        let tmpl = Template.instance();
        let job = tmpl.data && tmpl.data.job;
        let companyId = job.companyId;
        if (companyId) {
            return Companies.findOne({_id: companyId});
        }
    },
    applicantsCount(jobInfo) {
        return jobInfo && jobInfo.applicantsIds && jobInfo.applicantsIds.length || 0;
    },
    salary(jobInfo){
        let tmpl = Template.instance();
        let salary = jobInfo.salary;
        let salaryInfo;
        if(salary && _.indexOf(['Fixed-price', 'Hourly', 'Annual', 'Monthly'], salary.type) != -1){
            salaryInfo = tmpl.getSalaryInfo(salary);
        }
        else {
            salaryInfo = 'Undisclosed';
        }
        return salaryInfo;
    },
    companyImage(jobInfo) {
        let companyId = jobInfo.companyId;
        if(companyId){
            let company = Companies.findOne({_id: companyId});
            return company && company.logoUrl;
        }
    },
    companyName(isFirstChar, jobInfo){
        let companyId = jobInfo.companyId;
        if(companyId){
            let company = Companies.findOne({_id: companyId});
            if(isFirstChar){
                return company && company.name.charAt(0);
            }
            return company && company.name;
        }
    },
    isNotSelectedCompany() {
        if (!Session.get('companyId')) {
            return true;
        }
    }
});

Template.jobDetailsModal.events({
    'click #close-modal'(event, tmpl){
        event.preventDefault();
        removeTemplate(tmpl.view);
    },
    'click #company-name'(event, tmpl){
        removeTemplate(tmpl.view);
    },
});

let removeTemplate = function (view) {
    let params = Router.current().params;
    let query = params.query;
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};