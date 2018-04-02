import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import {VZ} from '/imports/startup/both/namespace';
import './skills-chip.html'
import './skill-chip.html'

function preparePresentData(skills) {
    return skills.map(skill => ({tag: skill.label}));
}

function prepareSkillsData(skills) {
    const result = {};
    for(let x = 0, count = skills.length; x < count; x++) {
        result[skills[x].label] = null;
    }
    return result;
}

function initializeChips (data = [], autocompleteData = []) {
    if(autocompleteData instanceof Array) {
        const options = {
            placeholder: 'Add a skill here',
            secondaryPlaceholder: 'Add a skill here',
            data: preparePresentData(data),
            autocompleteOptions: {
                data: prepareSkillsData(autocompleteData),
                limit: 5,
                minLength: 1
            }
        };
        $('.chips').material_chip(options);
    } else {
        console.error('autocomplete data must be array');
        throw 'autocomplete data must be array';
    }
};

Template.skillsChip.onCreated(function() {
  this.suggestedSkillsVar = new ReactiveVar([]);
});

Template.skillsChip.onRendered(function () {
  this.autorun(() => {
    initializeChips(Template.currentData().data);
  });
});

Template.skillsChip.helpers({
  suggestedSkills() {
    return Template.instance().suggestedSkillsVar.get();
  }
});

Template.skillsChip.events({
  'keyup .input': function(event, template) {
    const skills = Template.currentData().skills;
    if(event.target.value.length > 0) {
      const suggested = skills.filter(skill => {
        return skill.label.match(new RegExp(event.target.value, 'gi'));
      }).sort((a, b) => a.label.length - b.label.length);
      template.suggestedSkillsVar.set(suggested.slice(0, 5));
    } else {
      template.suggestedSkillsVar.set([]);
    }
  },
  'click .suggestedItem': function(event, template) {
    let skill = this;
    let currentSkillsLabels = _.map(template.data.data, function (skill) {
        return skill.label;
    });
    let skillsLabels = $('.chips').material_chip('data');
    let skillsLabelsNames = _.map(skillsLabels, function (skill) {
        return skill.tag;
    });

    if(_.indexOf(currentSkillsLabels, skill.label) == -1 && _.indexOf(skillsLabelsNames, skill.label) == -1){
        addChip(template, skill);
        skillsLabels.push({tag: skill.label});
        template.find('.input').value = '';
        template.suggestedSkillsVar.set([]);
    }
    else {
        VZ.notify('Skill already added');
    }
  },
  'click i': function(event, template) {
    let index = event.target.parentElement.innerHTML.indexOf('<');
    let label = event.target.parentElement.innerHTML.slice(0, index);
    let removeIndex = this.data.map(function(item) { return item.label; }).indexOf(label);
    this.data.splice(removeIndex, 1);
  }
});

function addChip(template, skill) {
  const chips = template.find('.chips');
  const input = template.find('.input');
  Blaze.renderWithData(Template.skillChip, skill, chips, input);
}
