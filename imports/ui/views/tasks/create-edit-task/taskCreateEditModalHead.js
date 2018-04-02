import { Template } from 'meteor/templating';
import './taskCreateEditModalHead.html';

Template.taskCreateEditModalHead.onRendered(function () {
  this.$('#titleTaskModal').characterCounter();
});
