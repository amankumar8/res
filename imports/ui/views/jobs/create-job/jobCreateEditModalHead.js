import { Skills } from '/imports/api/skills/skills';
import {Jobs} from "../../../../api/jobs/jobs";
import './jobCreateEditModalHead.html';
import './workerLocationChooser';
import './skills-chip'

Template.jobCreateEditModalHead.onCreated(function() {
  const job = Jobs.findOne({_id: this.data.jobId}, {fields: {workerLocation: 1}});
  this.data.modalTemplate.isWorkerLocationRestrictedVar = new ReactiveVar(job ? job.workerLocation.isRestricted: false);
});

Template.jobCreateEditModalHead.onRendered(function() {
  this.$('input').characterCounter();
    this.autorun(() => {
        this.subscribe('allSkills');
    });
});

Template.jobCreateEditModalHead.helpers({
  getTitle() {
    const job = Jobs.findOne(Template.instance().data.jobId, {fields: {title: 1}});
    return job && job.title;
  },
  getWorkerLocation() {
    const job = Jobs.findOne(Template.instance().data.jobId, {fields: {workerLocation: 1}});
    return job && job.workerLocation;
  },
  getCurrentSkills() {
    const job = Jobs.findOne(Template.instance().data.jobId, {fields: {skillsIds: 1}});
    return job && Skills.find({_id: {$in: job.skillsIds}}).fetch();
  },
  getAllSkills() {
    return Skills.find().fetch();
  },
  isWorkerLocationRestricted() {
    return Template.instance().data.modalTemplate.isWorkerLocationRestrictedVar.get();
  },
  isWorkerLocationRestrictionChosen(restricted) {
    const isRestricted = Template.instance().data.modalTemplate.isWorkerLocationRestrictedVar.get();
    if (isRestricted === false) {
      return restricted === 'anywhere';
    } else if (isRestricted === true) {
      return restricted === 'restricted';
    }
  }
});

Template.jobCreateEditModalHead.events({
  'click [name="workerLocation"]': function(event, template) {
    template.data.modalTemplate.isWorkerLocationRestrictedVar.set(event.target.value === 'restricted');
  }
});
