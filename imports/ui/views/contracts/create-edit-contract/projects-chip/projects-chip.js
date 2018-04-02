import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Projects } from '/imports/api/projects/projects';
import { VZ } from '/imports/startup/both/namespace';

import './projects-chip.html';
import './project-chip.html';

function preparePresentData(projects) {
  return projects.map(project => ({tag: project.name}));
}

function prepareProjectsData(projects) {
  const result = {};
  for(let x = 0, count = projects.length; x < count; x++) {
    result[projects[x].name] = null;
  }
  return result;
}

function initializeChips (data = [], autocompleteData = []) {
  if(autocompleteData instanceof Array) {
    const options = {
      placeholder: 'Add a project here',
      secondaryPlaceholder: 'Add a project here',
      data: preparePresentData(data),
      autocompleteOptions: {
        data: prepareProjectsData(autocompleteData),
        limit: 25,
        minLength: 1
      }
    };
    $('.chips').material_chip(options);
  } else {
    console.error('autocomplete data must be array');
    throw 'autocomplete data must be array';
  }
}

Template.projectsChip.onCreated(function() {
  this.suggestedProjectsVar = new ReactiveVar([]);
  this.searchString = new ReactiveVar('');

  this.autorun(() => {
    let data = Template.currentData().projectSearchParams;
    let searchString = this.searchString.get();
    let subscription = data.subscription;
    this.subscribe(subscription.name, searchString, subscription.limit, subscription.addQuery, subscription.addOptions);
  });
  
  this.autorun(() => {
    let data = Template.currentData().projectSearchParams;
    let subscriptionValue = data.subscriptionValue;
    this.subscribe(subscriptionValue.name, subscriptionValue.query, subscriptionValue.options, true);
  });
});

Template.projectsChip.onRendered(function () {
  this.autorun(() => {
    let data = Template.currentData();
    let assignedProjectIds = data.data;
    initializeChips(assignedProjectIds);
  });
});

Template.projectsChip.helpers({
  suggestedProjects() {
    return Template.instance().suggestedProjectsVar.get();
  }
});

Template.projectsChip.events({
  'keyup .input': function(event, template) {
    if(event.target.value.length > 0) {
      let projectsCreatedByUser = Roles.getGroupsForUser(Meteor.userId(), 'project-owner');
      let projectsWhereUserIsAdmin = Roles.getGroupsForUser(Meteor.userId(), 'project-admin');
      let projectsWhereUserIsManamger = Roles.getGroupsForUser(Meteor.userId(), 'project-manager');

      let relatedProjectsDirectly = _.union(projectsCreatedByUser, projectsWhereUserIsAdmin, projectsWhereUserIsManamger);
      template.searchString.set(event.target.value);
      let searchStringRegExp = new RegExp(event.target.value, 'gi');
      const projects = Projects.find({_id: {$in: relatedProjectsDirectly}, name: { $regex: searchStringRegExp }}, {limit: 25}).fetch();


      const suggested = projects.filter(project => {
        return project.name.match(searchStringRegExp);
      }).sort((a, b) => a.name.length - b.name.length);
      template.suggestedProjectsVar.set(suggested);
    } else {
      template.suggestedProjectsVar.set([]);
      template.searchString.set('');
    }
  },
  'click .suggestedItem': function(event, template) {
    let project = this;
    let currentProjectsNames = _.map(template.data.data, function (project) {
      return project.name;
    });
    let projectsNames = $('.chips').material_chip('data');
    let projectsLabelsNames = _.map(projectsNames, function (project) {
      return project.tag;
    });

    if(_.indexOf(currentProjectsNames, project.name) == -1 && _.indexOf(projectsLabelsNames, project.name) == -1){
      addChip(template, project);
      projectsNames.push({tag: project.name});
      template.find('.input').value = '';
      template.suggestedProjectsVar.set([]);
      let projectSearchParams = template.data.projectSearchParams;
      let projects = _.clone(projectSearchParams.value);
      projects.push(project);
      projectSearchParams.setFunction(projects);
    }
    else {
      VZ.notify('Project already added');
    }
  },
  'click i': function(event, template) {
    let projectSearchParams = template.data.projectSearchParams;
    let projects = _.clone(projectSearchParams.value);
    let index = event.target.parentElement.innerHTML.indexOf('<');
    let name = event.target.parentElement.innerHTML.slice(0, index);
    let removeIndex = template.data.data.map(function(item) { return item.name; }).indexOf(name);
    template.data.data.splice(removeIndex, 1);
    projects = _.reject(projects, (project) => {
     return project.name === name;
    });
    projectSearchParams.setFunction(projects);
  }
});

function addChip(template, project) {
  const chips = template.find('.chips');
  const input = template.find('.input');
  Blaze.renderWithData(Template.projectChip, project, chips, input);
}
