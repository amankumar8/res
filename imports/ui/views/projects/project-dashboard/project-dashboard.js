import './project-activity/project-activity';
import './project-info-layout/project-info-layout';
import './project-tasks-activity/project-task-activity';
import './project-time-tracker/project-time-tracker';
import './project-dashboard.html';

Template.projectDashboard.onCreated(function () {
    this.currentTab = new ReactiveVar('projectTasksActivity');
    this.autorun(() => {
        let data = Template.currentData();
        let tab = data.tab;
        if (tab === 'tasks') {
            this.currentTab.set('projectTasksActivity');
        }
        if (tab === 'activity') {
            this.currentTab.set('projectActivity');
        }
        if (tab === 'tracker'){
            this.currentTab.set('projectTimeTracker');
        }
    });
});

Template.projectDashboard.onRendered(function () {
    this.$('ul.tabs').tabs();
});

Template.projectDashboard.helpers({
    tab() {
        return Template.instance().currentTab.get();
    },
    isTabSelected(tabName) {
        let currentTab = Template.instance().currentTab.get();
        return tabName === currentTab ? 'active' : '';
    }
});

Template.projectDashboard.events({
    'click .tabs-row li': function (event, tmpl) {
      event.preventDefault();
        let currentTab = $(event.target).closest('li');
        let templateName = currentTab.data('template');
        let params, query;
        let projectId = Router.current().params.id;

        tmpl.currentTab.set(templateName);
        if (templateName === 'projectTasksActivity') {
            params = {id: projectId, tab: 'tasks'};
            query = {query: {'tasks': 'all'}};
          Router.go('projectDashboard', params, query);

        }
        else if (templateName === 'projectActivity') {
            params = {id: projectId, tab: 'activity'};
            query = {};
          Router.go('projectDashboard', params, query);

        }
        else if (templateName === 'projectTimeTracker') {
            params = {id: projectId, tab: 'tracker'};
            query = {};
          Router.go('projectDashboard', params, query);

        }
    }
});