import './worker-job-item.html'
import '../../../job-details/talent-details-modal'
import { Jobs } from '/imports/api/jobs/jobs';
import { Skills } from '/imports/api/skills/skills';
import { Contracts } from '/imports/api/contracts/contracts';
import { Projects } from '/imports/api/projects/projects';
import { editJob} from '/imports/api/jobs/methods';
import { VZ } from '/imports/startup/both/namespace';

const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;

Template.workerJobItem.onCreated(function () {
    this.subscribe('allUsers', {sort: {createdAt: 1}, limit: 5});
    this.subscribe('user', Meteor.userId());
});
Template.workerJobItem.onRendered(function () {
    this.$('.dropdown-button').dropdown();
    this.autorun(() => {
        this.subscribe('allSkills');
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        this.subscribe('job', userProfile.profile.selectedJobId);
    });
});

Template.workerJobItem.helpers({
    hoursWorked(){
        let tmpl = Template.instance();
        let userId = tmpl.data._id;
        tmpl.subscribe('userContractsById', userId);
        let contracts = Contracts.find({workerId: userId}, {fields: {trackingInfo: 1}}).fetch();
        let tracked = 0;
        for (let i = 0; i < contracts.length; i++) {
            for (let j = 0; j < contracts[i].trackingInfo.allTime.length; j++) {
                tracked += contracts[i].trackingInfo.allTime[j].tracked;
            }
        }
        return parseInt(tracked / oneHour);
    },
    projectsCompleted(){
        let tmpl = Template.instance();
        let userId = tmpl.data._id;
        tmpl.subscribe('countOfFinishedProjects', userId);
        return Projects.find({
            $or: [{assignedUsersIds: userId}, {ownerId: userId}],
            archived: true
        }).count();
    },
    skillName(){
        let skillId = this.valueOf();
        Template.instance().subscribe('oneSkillById', skillId);
        let skill = Skills.findOne({_id: skillId});
        if (skill && skill.label) {
            return skill && skill.label;
        } else {
            return this.valueOf();
        }

    },
    isJobSelected() {
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        if (userProfile && userProfile.profile && userProfile.profile.selectedJobId) {
            return true
        } else {
            return false;
        }
    },
    isApplications() {
        if(Session.get('typeWorkers') && Session.get('typeWorkers') === 'applications') {
            return true;
        }
    },
    isArchived() {
        if(Session.get('typeWorkers') && Session.get('typeWorkers') === 'archived') {
            return true;
        }
    },
    isShortlisted() {
        if(Session.get('typeWorkers') && Session.get('typeWorkers') === 'shortlisted') {
            return true;
        }
    },
    isHired() {
        if(Session.get('typeWorkers') && Session.get('typeWorkers') === 'hired') {
            return true;
        }
    }
});

Template.workerJobItem.events({
    'click #addArchived'(event, tmpl) {
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        let job = Jobs.findOne({_id: userProfile.profile.selectedJobId});

        if (job && job.archivedApplicantsIds && job.archivedApplicantsIds.indexOf(this._id) === -1) {
            job.archivedApplicantsIds.push(this._id);
        } else if (job && !job.archivedApplicantsIds) {
            job.archivedApplicantsIds = [];
            job.archivedApplicantsIds.push(this._id);
        }

        if (job && job.applicantsIds && job.applicantsIds.indexOf(this._id) > -1) {
            job.applicantsIds.splice(job.applicantsIds.indexOf(this._id), 1);
        }

        if (job && job.shortlistedApplicantsIds && job.shortlistedApplicantsIds.indexOf(this._id) > -1) {
            job.shortlistedApplicantsIds.splice(job.shortlistedApplicantsIds.indexOf(this._id), 1);
        }

        if (job && job.hiredApplicantsIds && job.hiredApplicantsIds.indexOf(this._id) > -1) {
            job.hiredApplicantsIds.splice(job.hiredApplicantsIds.indexOf(this._id), 1);
        }

        editJob.call(job, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.error(message);
            } else {
                tmpl.subscribe('user', this._id);
                let user = Meteor.users.findOne(this._id, {fields: {profile: 1}});
                if (user && user.profile && user.profile.fullName) {
                    VZ.notify(`${user.profile.fullName} (worker) sent to archive.`);
                } else {
                    VZ.notify('Worker sent to archive.');
                }
            }
        });
    },
    'click #addShortlisted'(event, tmpl) {
        event.preventDefault();
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        let job = Jobs.findOne({_id: userProfile.profile.selectedJobId});

        if (job && job.shortlistedApplicantsIds && job.shortlistedApplicantsIds.indexOf(this._id) === -1) {
            job.shortlistedApplicantsIds.push(this._id);
        } else if (job && !job.shortlistedApplicantsIds) {
            job.shortlistedApplicantsIds = [];
            job.shortlistedApplicantsIds.push(this._id);
        }

        if (job && job.applicantsIds && job.applicantsIds.indexOf(this._id) > -1) {
            job.applicantsIds.splice(job.applicantsIds.indexOf(this._id), 1);
        }

        editJob.call(job, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.error(message);
            } else {
                tmpl.subscribe('user', this._id);
                let user = Meteor.users.findOne(this._id, {fields: {profile: 1}});
                if (user && user.profile && user.profile.fullName) {
                    VZ.notify(`${user.profile.fullName} (worker) sent to shortlist.`);
                } else {
                    VZ.notify('Worker sent to shortlist.');
                }
            }
        });
    },
    'click #hire-button'(event, tmpl) {
        event.preventDefault();
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        let job = Jobs.findOne({_id: userProfile.profile.selectedJobId});

        if (job && job.hiredApplicantsIds && job.hiredApplicantsIds.indexOf(this._id) === -1) {
            job.hiredApplicantsIds.push(this._id);
        } else if (job && !job.hiredApplicantsIds) {
            job.hiredApplicantsIds = [];
            job.hiredApplicantsIds.push(this._id);
        }

        if (job && job.applicantsIds && job.applicantsIds.indexOf(this._id) > -1) {
            job.applicantsIds.splice(job.applicantsIds.indexOf(this._id), 1);
        }

        if (job && job.shortlistedApplicantsIds && job.shortlistedApplicantsIds.indexOf(this._id) > -1) {
            job.shortlistedApplicantsIds.splice(job.shortlistedApplicantsIds.indexOf(this._id), 1);
        }

        editJob.call(job, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.error(message);
            } else {
                tmpl.subscribe('user', this._id);
                let user = Meteor.users.findOne(this._id, {fields: {profile: 1}});
                if (user && user.profile && user.profile.fullName) {
                    VZ.notify(`${user.profile.fullName} (worker) sent to hire.`);
                } else {
                    VZ.notify('Worker sent to hire.');
                }
            }
        });
    },
    'click #re-hire-button'(event, tmpl) {
        event.preventDefault();
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        let job = Jobs.findOne({_id: userProfile.profile.selectedJobId});

        if (job && job.hiredApplicantsIds && job.hiredApplicantsIds.indexOf(this._id) === -1) {
            job.hiredApplicantsIds.push(this._id);
        } else if (job && !job.hiredApplicantsIds) {
            job.hiredApplicantsIds = [];
            job.hiredApplicantsIds.push(this._id);
        }

        if (job && job.archivedApplicantsIds && job.archivedApplicantsIds.indexOf(this._id) > -1) {
            job.archivedApplicantsIds.splice(job.archivedApplicantsIds.indexOf(this._id), 1);
        }

        editJob.call(job, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.error(message);
            } else {
                tmpl.subscribe('user', this._id);
                let user = Meteor.users.findOne(this._id, {fields: {profile: 1}});
                if (user && user.profile && user.profile.fullName) {
                    VZ.notify(`${user.profile.fullName} (worker) sent to hire.`);
                } else {
                    VZ.notify('Worker sent to hire.');
                }
            }
        });
    },
    'click #shortlist-button'(event, tmpl) {
        event.preventDefault();
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        let job = Jobs.findOne({_id: userProfile.profile.selectedJobId});

        if (job && job.shortlistedApplicantsIds && job.shortlistedApplicantsIds.indexOf(this._id) === -1) {
            job.shortlistedApplicantsIds.push(this._id);
        } else if (job && !job.shortlistedApplicantsIds) {
            job.shortlistedApplicantsIds = [];
            job.shortlistedApplicantsIds.push(this._id);
        }

        if (job && job.applicantsIds && job.applicantsIds.indexOf(this._id) > -1) {
            job.applicantsIds.splice(job.applicantsIds.indexOf(this._id), 1);
        }

        editJob.call(job, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.error(message);
            } else {
                tmpl.subscribe('user', this._id);
                let user = Meteor.users.findOne(this._id, {fields: {profile: 1}});
                if (user && user.profile && user.profile.fullName) {
                    VZ.notify(`${user.profile.fullName} (worker) sent to shortlist.`);
                } else {
                    VZ.notify('Worker sent to shortlist.');
                }
            }
        });
    },
    'click #send-shortlist-button'(event, tmpl) {
        event.preventDefault();
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        let job = Jobs.findOne({_id: userProfile.profile.selectedJobId});

        if (job && job.shortlistedApplicantsIds && job.shortlistedApplicantsIds.indexOf(this._id) === -1) {
            job.shortlistedApplicantsIds.push(this._id);
        } else if (job && !job.shortlistedApplicantsIds) {
            job.shortlistedApplicantsIds = [];
            job.shortlistedApplicantsIds.push(this._id);
        }

        if (job && job.archivedApplicantsIds && job.archivedApplicantsIds.indexOf(this._id) > -1) {
            job.archivedApplicantsIds.splice(job.archivedApplicantsIds.indexOf(this._id), 1);
        }

        editJob.call(job, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.error(message);
            } else {
                tmpl.subscribe('user', this._id);
                let user = Meteor.users.findOne(this._id, {fields: {profile: 1}});
                if (user && user.profile && user.profile.fullName) {
                    VZ.notify(`${user.profile.fullName} (worker) sent to shortlist.`);
                } else {
                    VZ.notify('Worker sent to shortlist.');
                }
            }
        });
    },
    'click #cancel-button'(event, tmpl) {
        event.preventDefault();
        let userProfile = Meteor.users.findOne(Meteor.userId(), {fields: {profile: 1}});
        let job = Jobs.findOne({_id: userProfile.profile.selectedJobId});

        if (job.hiredApplicantsIds.indexOf(this._id) > -1) {
            job.hiredApplicantsIds.splice(job.hiredApplicantsIds.indexOf(this._id), 1);
        }

        if (job && job.shortlistedApplicantsIds && job.shortlistedApplicantsIds.indexOf(this._id) > -1) {
            job.shortlistedApplicantsIds.splice(job.shortlistedApplicantsIds.indexOf(this._id), 1);
        }

        if (job && job.archivedApplicantsIds && job.archivedApplicantsIds.indexOf(this._id) === -1) {
            job.archivedApplicantsIds.push(this._id);
        } else if (job && !job.archivedApplicantsIds) {
            job.archivedApplicantsIds = [];
            job.archivedApplicantsIds.push(this._id);
        }

        editJob.call(job, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.error(message);
            } else {
                tmpl.subscribe('user', this._id);
                let user = Meteor.users.findOne(this._id, {fields: {profile: 1}});
                if (user && user.profile && user.profile.fullName) {
                    VZ.notify(`Hiring process cancel, ${user.profile.fullName} (worker) sent to archive.`);
                } else {
                    VZ.notify('Hiring process cancel, worker sent to archive.');
                }
            }
        });
    },
    'click #copyToClipboard'(event, tmpl) {
        copyToClipboard('https://vezio.jobs/search/talent/' + this._id);
    },
    'click #view-talent'(event, tmpl){
        event.preventDefault();
        let talent = this;
        let talentId = talent._id;
        if (talentId) {
            tmpl.subscribe('user', talentId);
            let talentFull = Meteor.users.findOne({_id: talentId});
            if (talentFull) {
                Blaze.renderWithData(Template.talentDetailsModal, {data: talentFull}, $('body')[0])
            }
        }
    }
});

function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        return clipboardData.setData("Text", text);

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        let textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}