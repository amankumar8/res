import './screenshots-main.html';
Template.screenshotsMain.onCreated(function () {
});
Template.screenshotsMain.onRendered(function () {
  this.$('ul.tabs').tabs();

  /* SELECT */
  $('select').material_select();

  /* tooltip */
  $('.tooltipped').tooltip({delay: 50});


});
Template.screenshotsMain.onDestroyed(function () {
  this.$('.tooltipped').tooltip('remove');
});

Template.screenshotsMain.helpers({
  tab() {
    let user = Meteor.user();
    return user.profile && user.profile.selectedCompanyId ? 'workersScreenshots' : 'myScreenshots';
  }
});

Template.screenshotsMain.events({});