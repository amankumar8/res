import { Template } from 'meteor/templating';
import './contractCreateEditModalHead.html';

Template.contractCreateEditModalHead.onRendered(function () {
  this.$('#titleContractModal').characterCounter();
});
