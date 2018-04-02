import {VZ} from '/imports/startup/both/namespace';
import {UserPortfolioProjects} from '/imports/api/userPortfolioProjects/userPortfolioProjects';
import {
  insertPortfolioProject,
  updatePortfolioProject,
  removePortfolioProject
} from '/imports/api/userPortfolioProjects/methods';

import './portfolio-card.html';

Template.portfolioCard.onCreated(function () {
  this.projectsLimit = new ReactiveVar(3);
  this.searchQuery = new ReactiveVar({});

  this.autorun(() => {
    let userId = Router.current().params.id;
    let user = Meteor.users.findOne({_id: userId});
    if (user && user.profile && user.profile.portfolioProjects) {
      let searchQuery = {
        _id: {
          $in: user.profile.portfolioProjects || []
        }
      };
      this.searchQuery.set(searchQuery);
    }
    this.subscribe('userPortfolioProjects', userId);

  });
});
Template.portfolioCard.onRendered(function () {
  this.$('.dropdown-button').dropdown({
      inDuration: 200,
      outDuration: 125,
      constrain_width: false, // Does not change width of dropdown to that of the activator
      hover: false, // Activate on hover
      gutter: 0, // Spacing from edge
      belowOrigin: false, // Displays dropdown below the button
      alignment: 'left' // Displays dropdown with edge aligned to the left of button
    }
  );
  this.autorun(() => {
    this.searchQuery.get();
  })
});
Template.portfolioCard.helpers({
  userPortfolioProjects() {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (!user || !user.profile) {
      return;
    }
    if (user.profile.portfolioProjects) {
      let portfolioProjects = Template.instance().searchQuery.get();
      return UserPortfolioProjects.find(portfolioProjects, {
        sort: {
          createdAt: -1
        },
        limit: Template.instance().projectsLimit.get()
      });
    }
  },
  showLess() {
    let portfolioProjectsQuery = Template.instance().searchQuery.get();

    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (!user || !user.profile) {
      return;
    }
    let portfolioProjects = UserPortfolioProjects.find(portfolioProjectsQuery, {
      sort: {
        createdAt: -1
      }
    }).count();
    if (user.profile.portfolioProjects) {
      if (_.has(portfolioProjectsQuery, 'skills')) {
        return Template.instance().projectsLimit.get() == portfolioProjects && Template.instance().projectsLimit.get() > 3;
      } else {
        return Template.instance().projectsLimit.get() == user.profile.portfolioProjects.length && Template.instance().projectsLimit.get() > 3;
      }
    }
  },
  showMore() {
    let portfolioProjectsQuery = Template.instance().searchQuery.get();
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (!user || !user.profile) {
      return;
    }
    let portfolioProjects = UserPortfolioProjects.find(portfolioProjectsQuery, {
      sort: {
        createdAt: -1
      }
    }).count();
    if (user.profile.portfolioProjects) {
      if (_.has(portfolioProjectsQuery, 'skills')) {
        return Template.instance().projectsLimit.get() < portfolioProjects;
      }
      else {
        return Template.instance().projectsLimit.get() < user.profile.portfolioProjects.length;
      }
    }
  },
  profileOwner() {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    return user && Meteor.userId() == user._id;
  },
  portfolioCategories() {
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (!user || !user.profile) {
      return;
    }
    if (user.profile.portfolioProjects) {
      let userPortfolioProjects = UserPortfolioProjects.find({
        _id: {
          $in: user.profile.portfolioProjects || []
        }
      }).fetch();
      return _.union(_.flatten(_.map(userPortfolioProjects, function (project) {
        return project.skills;
      })));
    }
  },
  categoryName() {
    return Template.instance().searchQuery.get().skills || 'All categories';
  }

});
Template.portfolioCard.events({
  'click .edit-portfolio': function (event, tmpl) {
    event.preventDefault();
    const portfolioId = this._id;
    let portfolioProject = UserPortfolioProjects.findOne({_id: portfolioId});
    let parentNode = $('body')[0],
      onPortfolioEdit = function (portfolio, portfolioTmpl) {
        portfolio._id = portfolioId;
        updatePortfolioProject.call(portfolio, function (error, result) {
          if (!error) {
            portfolioTmpl.$('#edit-portfolio-modal').modal('close');
            removeTemplate(portfolioTmpl.view);
            VZ.notify('Success');
          }
          else {
            VZ.notify(error.message.replace(/[[0-9]+]/gi, ''));
          }
        });
      },
      modalData = {
        portfolioProject: portfolioProject,
        onPortfolioEdit: onPortfolioEdit
      };
    Blaze.renderWithData(Template.editPortfolioModal, modalData, parentNode);
  },

  'click .add-portfolio': function (event, tmpl) {
    event.preventDefault();
    let parentNode = $('body')[0],
      onPortfolioInsert = function (portfolio, portfolioTmpl) {
        insertPortfolioProject.call(portfolio, function (error, result) {
          if (!error) {
            portfolioTmpl.$('#edit-portfolio-modal').modal('close');
            removeTemplate(portfolioTmpl.view);
            VZ.notify('Success');
            tmpl.projectsLimit.set(3);
          }
          else {
            VZ.notify(error.message.replace(/[[0-9]+]/gi, ''));
          }
        });
      },
      modalData = {
        onPortfolioInsert: onPortfolioInsert
      };
    Blaze.renderWithData(Template.editPortfolioModal, modalData, parentNode);
  },
  'click .load-more': function (event, tmpl) {
    event.preventDefault();
    let portfolioProjectsQuery = tmpl.searchQuery.get();
    let projectsToShow;
    let user = Meteor.users.findOne({_id: Router.current().params.id});
    if (!user || !user.profile) {
      return;
    }
    let portfolioProjects = UserPortfolioProjects.find(portfolioProjectsQuery, {
      sort: {
        createdAt: -1
      }
    }).count();
    if (_.has(portfolioProjectsQuery, 'skills')) {
      projectsToShow = portfolioProjects || 3;
    }
    else {
      projectsToShow = user.profile.portfolioProjects.length || 3;
    }
    tmpl.projectsLimit.set(projectsToShow);
  },
  'click .show-less': function (event, tmpl) {
    event.preventDefault();
    tmpl.projectsLimit.set(3);
  },
  'click .delete-portfolio': function (event, tmpl) {
    event.preventDefault();
    const portfolioId = this._id;
    removePortfolioProject.call({portfolioId});
    tmpl.projectsLimit.set(3);
  },
  'click .show-portfolio-info': function (event, tmpl) {
    event.preventDefault();
    const portfolioId = this._id;
    let portfolioProject = UserPortfolioProjects.findOne({_id: portfolioId});
    let parentNode = $('body')[0],
      modalData = {
        portfolioProject: portfolioProject
      };
    Blaze.renderWithData(Template.portfolioInfoModal, modalData, parentNode);
  },
  'click .portfolio-category': function (event, tmpl) {
    event.preventDefault();
    let newQuery;
    let category = tmpl.$(event.currentTarget).data().name;
    let searchQuery = tmpl.searchQuery.get();
    if (category == 'all') {
      newQuery = _.omit(searchQuery, 'skills');
    }
    else {
      newQuery = _.extend(searchQuery, {skills: category});
    }
    tmpl.searchQuery.set(newQuery);
    tmpl.projectsLimit.set(3);
  }
});

let removeTemplate = function (view) {
  setTimeout(function () {
    Blaze.remove(view);
  }, 500);
};