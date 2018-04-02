import {VZ} from '/imports/startup/both/namespace';
import './project-task-activity.html';
import './create-edit-project-task/create-edit-project-task';
import './tasks/tasks';
import './create-edit-project-task/task-hard-limit-modal/task-hard-limit-modal';

Template.projectTasksActivity.onCreated(function () {

  let tasksType = this.data.tasks;
  let templateName;
  if (tasksType === 'assigned') {
    templateName = 'assignedTasks';
  }
  else if (tasksType === 'in-review') {
    templateName = 'inReview';
  }
  else if (tasksType === 'all') {
    templateName = 'allProjectTasks';
  }
  else if (tasksType === 'completed') {
    templateName = 'compleatedTasks';
  }
  else {
    templateName = 'allProjectTasks'
  }
  this.currentTab = new ReactiveVar(templateName);

  this.autorun(() => {
    let data = Template.currentData();
    let projectId = data.project && data.project._id;
    this.subscribe('tasksCounts', projectId);
  });
});
Template.projectTasksActivity.onRendered(function () {
  this.$('ul.tabs').tabs();
  this.$('.dropdown-button').dropdown();

  $(document).on('click', 'li.action .dropdown-content', function (e) {
    e.stopPropagation();
  });
  this.$('.project-hastip').tooltipsy({
    offset: [0, 10],
    delay: 50,
    css: {
      'padding': '2px 15px',
      'font-size': '12px',
      'font-weight': '500',
      'border-radius': '4px',
      'max-width': '150px',
      'color': '#fff',
      'background-color': '#8b8b8b',
      'text-shadow': 'none'
    }
  });
  // this.autorun(() => {
  //   setTimeout(()=> {
  //     $('.tooltipped').tooltip({delay: 50});
  //   }, 500)
  // });
});

Template.projectTasksActivity.helpers({
  tab() {
    return Template.instance().currentTab.get();
  },
  isTabSelected(tabName) {
    let tasks = Router.current().params.query.tasks;
    if(tasks){
      return tabName === tasks ? 'active' : '';
    }
    else {
      return tabName === 'all' ? 'active' : '';
    }
  },
  projectAssignedUsers() {
    let assignedUsersIds = this.project && this.project.assignedUsersIds || [];
    return Meteor.users.find({_id: {$in: assignedUsersIds}}, {limit: 5}).fetch() || [];
  },
  projectAssignedUsersCount() {
    let assignedUsersIds = this.project && this.project.assignedUsersIds || [];
    let assignedUsers = Meteor.users.find({_id: {$in: assignedUsersIds}}).fetch() || [];
    if(assignedUsers.length >= 5){
      return assignedUsers.length - 5;
    }
    if(assignedUsers.length < 5){
      return 0;
    }
    return assignedUsers.length;
  },
  canEditProject() {
    let projectId = this.project && this.project._id;
    let ownerId = this.project && this.project.ownerId;
    return VZ.canUser('editProject', Meteor.userId(), projectId) || Meteor.userId() === ownerId;
  },
  allTaskCount() {
    return Counts.get('all');
  },
  assignedTaskCount() {
    return Counts.get('assigned');
  },
  reviewTaskCount() {
    return Counts.get('in-review');
  },
  completedTasksCount() {
    return Counts.get('completed');
  },
  accent(tab) {
    if (tab === Template.instance().currentTab.get()) {
      return 'tab-accent-white';
    }
  }
});

Template.projectTasksActivity.events({
  'click .tab': function(event, template) {
    event.preventDefault();
    let id = $(event.currentTarget).prop('id');

    if(id === 'all') {
      template.currentTab.set('allProjectTasks');
    } else if(id === 'assigned') {
      template.currentTab.set('assignedTasks');
    } else if(id === 'in-review') {
      template.currentTab.set('inReview');
    } else if(id === 'completed') {
      template.currentTab.set('compleatedTasks');
    }
    let projectId = Router.current().params.id;
    let tabName = Router.current().params.tab;

    Router.go('projectDashboard', {id: projectId, tab: tabName}, {query: {'tasks': id}});
  },
  'click #project-users': function (event, tmpl) {
    event.preventDefault();
    let projectId = tmpl.data.project._id;
    let parentNode = $('body')[0],
      modalData = {
        projectId: projectId
      };
    Blaze.renderWithData(Template.assignUsersToProjectModal, modalData, parentNode);
  }
});
