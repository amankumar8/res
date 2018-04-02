/**
 * Created by yukinohito on 3/25/17.
 */
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import {Projects} from '/imports/api/projects/projects';
import './projects-list-projects-tab.html';
import '../../create-edit-project/projectCreateEditModalAside'
import '../../create-edit-project/projectCreateEditModalActions'
import '../../create-edit-project/projectCreateEditModalDetails'
import '../../create-edit-project/projectCreateEditModalHead'
import '../../create-edit-project/projectCreateModalCentre'

Template.projectsListProjectsTab.onCreated(function () {
  this.query = new ReactiveVar({archived: false});
  this.isReady = new ReactiveVar(false);
  this.activeFilter = new ReactiveVar('Most recent');
  this.limit = new ReactiveVar(10);

  this.autorun(() => {
    let query = _.clone(this.query.get());
    let limit = this.limit.get();
    let sub = this.subscribe('projects.projectsListNew', query, {limit});
    if (sub.ready()) {
      this.isReady.set(true);
    }
  });
});

Template.projectsListProjectsTab.onRendered(function () {
  this.autorun(() => {
    if (this.isReady.get()) {
      Meteor.defer(function () {
        $('.collapsible').collapsible();
      });
    }
  });
  this.$('.dropdown-button').dropdown({});
  this.$('.collapsible').collapsible();
  $('#table_search .search').click(function () {
    $(this).parent('#table_search').addClass('active');
  });
  $('#table_search .close').click(function () {
    $(this).parent('#table_search').removeClass('active');
  });
});

Template.projectsListProjectsTab.helpers({
  isSubscriptionReady(){
    return Template.instance().isReady.get();
  },
  getActiveFilter() {
    return Template.instance().activeFilter.get();
  },
  getProjects() {
    const template = Template.instance();
    const limit = template.limit.get();
    const filter = template.activeFilter.get();
    const query = template.query.get();
    let projects = Projects.find(query, {limit, sort: {name: -1}}).fetch();

    if (filter === 'Most recent') {
      projects.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (filter === 'Most popular') {
      projects.sort((a, b) => b.assignedUsersIds - a.assignedUsersIds);
    } else if (filter === 'Date added') {
      projects.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      throw new Meteor.Error(`Wrong filter ${template.activeFilter.get()}`);
    }
    return projects;
  },
  moreLeft() {
    const template = Template.instance();
    const limit = template.limit.get();
    return limit < Counts.get('projects-dashboard-counts');
  }
});

Template.projectsListProjectsTab.events({
  'click .filterItem': function (event, template) {
    const newActiveFilter = event.target.innerText;
    template.activeFilter.set(newActiveFilter);
  },
  'click .btn-load-more': function (event, template) {
    template.limit.set(template.limit.get() + 10);
  },
  'input #search-filter': function (event, tmpl) {
    event.preventDefault();
    let value = tmpl.$('#search-filter').val().trim();
    let query = _.clone(tmpl.query.get());
    query.name = {$regex: value, $options: 'gi'};
    tmpl.query.set(query);
  },
  'click .add-new': function (event, template) {
      const modalData = {
          generalTemplate: 'projectCreateModalCentre'
      };
      Blaze.renderWithData(Template.centreCreateModal, modalData, $('body')[0]);
      ga('send', 'event', 'create-project', 'vezio-work');
      return true;
  }
});
