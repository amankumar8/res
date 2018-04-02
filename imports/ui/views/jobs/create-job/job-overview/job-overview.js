import { VZ } from '/imports/startup/both/namespace';
import { Skills } from '/imports/api/skills/skills';
import './job-overview.html';
import {editJob} from '/imports/api/jobs/methods';

Template.overviewJob.helpers({
    jobSkills() {
        let skillsIds = Template.instance().data.job.skillsIds || [];
        let skillLabels =  _.map(skillsIds, function (element) {
            return {tag: Skills.findOne({_id:element}).label};
        });
        return _.map(skillLabels, function (element) {
            return element.tag;
        }).join().replace(/,/gi, ', ');
    },
    salary() {
        let salary;
        let tmpl = Template.instance();
        let jobSalary = tmpl.data.job.salary;
        if(jobSalary){
            if(jobSalary.type == 'Annual'){
                salary =  '$'+jobSalary.min+'-'+'$'+jobSalary.max;
            }
            else if(jobSalary.type == 'Montly'){
                salary =  '$'+jobSalary.montlyRate;
            }
            else if(jobSalary.type == 'Hourly'){
                salary =  '$'+jobSalary.hourlyRate;
            }
            else if(jobSalary.type == 'Fixed price'){
                salary =  '$'+jobSalary.contractPrice;
            }
            return salary;
        }
    }
});

Template.overviewJob.events({
    'click .discard': function (event, tmpl) {
        event.preventDefault();
        let jobId = this.job._id;
        Router.go('addLocation', {id: jobId});
    },
    'click .next': function (event, tmpl) {
        event.preventDefault();
        let job = this.job;
        if(job){
            job.isDraft = false;
            editJob.call(job, (err, res) => {
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