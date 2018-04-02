import './user-job-item.html';
import { Companies } from '/imports/api/companies/companies.js';
import { Jobs } from '/imports/api/jobs/jobs';
import { Skills } from '/imports/api/skills/skills';
import {workerLocationTemplate} from '../../utils';

import '../../../job-details/job-datails-modal'

Template.userJobItem.onCreated(function () {
    this.subscribe('allSkills');
});
Template.userJobItem.onRendered(function () {
    this.$('.dropdown-button').dropdown();
    this.autorun(() => {
        this.subscribe('allSkills');
    });
});

Template.userJobItem.helpers({
    companyImage(){
        let companyId = this.companyId;
        if (companyId) {
            Template.instance().subscribe('companyById', companyId);
            let company = Companies.find({_id: companyId}).fetch();
            return company[0] && company[0].logoUrl;
        }
    },
    companyName(isFirstChar){
        let companyId = this.companyId;
        if (companyId) {
            Template.instance().subscribe('companyById', companyId);
            let company = Companies.find({_id: companyId}).fetch();
            if (isFirstChar) {
                return company[0] && company[0].name.charAt(0);
            }
            return company[0] && company[0].name;
        }
    },
    skillName(){
        let skillId = this.valueOf();
        let skill = Skills.findOne({_id: skillId});
        return skill && skill.label;
    },
    workerLocation(){
        let job = this;
        return workerLocationTemplate(job);
    },
    isInvationsOrProposals() {
        if (Session.set('typeJobs') && (Session.set('typeJobs') === 'proposals' ||
                Session.set('typeJobs') === 'invations')) {
            return true;
        }
    }
});

Template.userJobItem.events({
    'click #view-job'(event, tmpl){
        event.preventDefault();
        let job = this;

        let jobId = job._id;
        if (jobId) {
            let job = Jobs.findOne({_id: jobId});
            if (job) {
                /*const modalData = {
                    actionsTemplate: 'jobCreateEditModalActions',
                    headTemplate: 'jobCreateEditModalHead',
                    headTemplateData: {jobId: jobId},
                    detailsTemplate: 'jobCreateEditModalDetails',
                    detailsTemplateData: {jobId: jobId},
                    asideTemplate: 'jobCreateEditModalAside',
                    asideTemplateData: {jobId: jobId}
                };*/

                Blaze.renderWithData(Template.jobDetailsModal, {job: job}, $('body')[0])
                //Blaze.renderWithData(Template.rightDrawerModal, modalData, document.body);
            }
        }
    }
});