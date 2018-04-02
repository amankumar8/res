import {Jobs} from '/imports/api/jobs/jobs';
import {SyncedCron} from 'meteor/percolate:synced-cron';

if (Meteor.isServer) {
    let makeExpireSoon = function (id) {
        let jobToUpdate = Jobs.findOne({_id: id});
        if (jobToUpdate) {
            Jobs.update({_id: id}, {$set: {status: 'Will expire soon'}})
        }
        else {
            throw new Meteor.Error('Job is not found');
        }
    };

    let makeClosed = function (id) {
        let jobToUpdate = Jobs.findOne({_id: id});
        if (jobToUpdate) {
            Jobs.update({_id: id}, {$set: {status: 'Closed', isArchived: true}})
        }
        else {
            throw new Meteor.Error('Job is not found');
        }
    };

    SyncedCron.add({
        name: 'Changing job expire status',
        schedule: function (parser) {
            return parser.text('every 45 mins');
        },
        job: function () {
            let jobs = Jobs.find().fetch(),
                currDate = moment();
            _.each(jobs, function (job) {
                let expireAt = moment(job.expireAt),
                    diff = currDate.diff(expireAt, 'milliseconds'),
                    oneWeek = 604800000;
                if (Math.abs(diff) <= oneWeek && !(currDate >= expireAt)) {
                    makeExpireSoon(job._id);
                } else if (currDate >= expireAt) {
                    makeClosed(job._id);
                }
            });
        }
    });
}