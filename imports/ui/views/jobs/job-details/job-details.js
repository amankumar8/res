import {VZ} from '/imports/startup/both/namespace';
import {Skills} from '/imports/api/skills/skills';
import {applyForJob, addViewCount} from '/imports/api/jobs/methods';

import './job-details.html';

Template.jobDetails.onCreated(function () {
    let jobId = this.data.job._id;

    addViewCount.call({jobId:jobId}, (err, res) => {
        if (err) {
            let message = err.reason || err.message;
            VZ.notify(message);
        }
    });
});

Template.jobDetails.helpers({
    jobSkills() {
        let skillsIds = Template.instance().data.job.skillsIds || [];
        let skillLabels = _.map(skillsIds, function (element) {
            return {tag: Skills.findOne({_id: element}).label};
        });
        return _.map(skillLabels, function (element) {
            return element.tag;
        }).join().replace(/,/gi, ', ');
    },
    salary() {
        let salary;
        let tmpl = Template.instance();
        let jobSalary = tmpl.data.job.salary;
        if (jobSalary) {
            if (jobSalary.type == 'Annual') {
                salary = '$' + jobSalary.min + '-' + '$' + jobSalary.max;
            }
            else if (jobSalary.type == 'Hourly') {
                salary = '$' + jobSalary.hourlyRate;
            }
            else if (jobSalary.type == 'Fixed price') {
                salary = '$' + jobSalary.contractPrice;
            }
            return salary;
        }
    },
    applied() {
        let applicantsIds = Template.instance().data.job.applicantsIds || [];
        let userId = Meteor.userId();
        return _.indexOf(applicantsIds, userId) == -1;
    },
    isDraft() {
        let tmpl = Template.instance();
        return tmpl.data.job.isDraft;
    },
    isExpired() {
        let tmpl = Template.instance();
        let currDate = moment();
        let expireAt = moment(tmpl.data.job.expireAt);
        return currDate >= expireAt
    }
});

Template.jobDetails.events({
    'click .discard': function (event, tmpl) {
        event.preventDefault();
        Router.go('userJobs');
    },
    'click .apply': function (event, tmpl) {
        event.preventDefault();
        let jobId = this.job._id;
        if (jobId) {
            applyForJob.call({jobId:jobId}, (err, res) => {
                if (err) {
                    let message = err.reason || err.message;
                    VZ.notify(message);
                } else {
                    Router.go('userJobs');
                }
            });
        }
    }
});