import {Projects} from '/imports/api/projects/projects';
import './projects-list.html';

Template.dashboardProjectsList.onCreated(function () {
  this.isReady = new ReactiveVar(false);
  this.autorun(() => {
    let sub = this.subscribe('dashboardProjectsList');
    if (sub.ready()) {
      this.isReady.set(true);
    }
  });
});

Template.dashboardProjectsList.helpers({
  projectsItems() {
    let tmpl = Template.instance();
    let ready = tmpl.isReady.get();
    if (ready) {
      return Projects.find({
        $or: [
          {ownerId: Meteor.userId()},
          {assignedUsersIds: Meteor.userId()}
        ], archived: false
      }).fetch();
    }
    else {
      return [];
    }
  },
  emptyCardMessage() {
    return 'There are no projects to show';
  },
  dataLoadingMessage() {
    return 'Loading...';
  },
  isSubscriptionReady() {
    return Template.instance().isReady.get();
  }
});
