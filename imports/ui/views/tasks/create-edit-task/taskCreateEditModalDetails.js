import { Template } from 'meteor/templating';
import './taskCreateEditModalDetails.html';

Template.taskCreateEditModalDetails.onRendered(function () {
  this.$('.modal-description').characterCounter();
});
