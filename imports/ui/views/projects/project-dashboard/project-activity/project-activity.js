import {VZ} from '/imports/startup/both/namespace';
import {ActivityMessages} from '/imports/api/activityMessages/activityMessages';
import {uploadMessageFile} from '/imports/api/google-services/google-api/methods';
import {addActivityMessage} from '/imports/api/activityMessages/methods';

import './project-activity.html';
import './messages/messages';

Template.projectActivity.onCreated(function () {
  this.fileToUpload = new ReactiveVar({});
  this.autorun(() => {
    let data = Template.currentData();
    this.subscribe('projectActivityMessages', data.project._id);
  });
});
Template.projectActivity.helpers({
  activityMessages() {
    let activityMessagesIds = this.project.activityMessagesIds || [];
    return ActivityMessages.find({_id: {$in: activityMessagesIds}}, {sort: {createdAt: -1}}).fetch();
  },
  formatTime(timeToFormat) {
    return moment(timeToFormat).fromNow();
  },
  assignedUsersCount() {
    return this.project.assignedUsersIds ? this.project.assignedUsersIds.length : 0;
  },
  timeTracked() {
    return this.project.trackingInfo ? parseInt(this.project.trackingInfo.allUsers.allTime.tracked / 1000) : 0;
  },
  allTasksCount() {
    return this.project.info ? this.project.info.tasksCount : 0;
  },
  completedTasksCount() {
    return this.project.info ? this.project.info.tasksCompleted : 0;
  },
  moneyEarned() {
    return this.project.trackingInfo ? this.project.trackingInfo.allUsers.allTime.earned.toFixed(2) : 0;
  },
  templateName() {
    let messageType = this.type;
    if (messageType === 'project-activity-message') {
      return 'projectActivityMessage';
    }
    else if (messageType === 'user-changes-message' || messageType === 'project-created-message') {
      return 'notificationMessage';
    }
  },
  templateData() {
    this.projectId = Template.instance().data.project._id;
    return this;
  }
});
Template.projectActivity.events({
  'submit #activity-message': _.debounce(function (event, tmpl) {
    event.preventDefault();
    event.stopPropagation();

    let activityMessage = tmpl.$('#message-text').val();
    if (!activityMessage) {
      return;
    } else {
      let message = {message: activityMessage};
      let projectId = this.project._id;
      let fileToUpload = tmpl.fileToUpload.get();
      if (fileToUpload && fileToUpload.size > 0) {
        if (fileToUpload.size >= 5 * 1000000) {
          VZ.notify('File too large! Limit 5MB');
          $('#file-path').val('');
          return;
        }
        uploadMessageFile.call(fileToUpload, function (error, result) {
          if (result) {
            message.file = result;
            addActivityMessage.call({message, projectId}, (error, result) => {
              if (error) {
                VZ.notify(error.reason);
              }
              else {
                tmpl.$('#message-text').val('');
              }
            });
          } else if (error) {
            VZ.notify(error.message);
          }
        });

      }
      else {
        addActivityMessage.call({message, projectId}, (error, result) => {
          if (error) {
            VZ.notify(error.reason);
          }
          else {
            tmpl.$('#message-text').val('');
          }
        });
      }


    }
  }, 500, true),
  'change #post-file': function (event, tmpl) {
    event.preventDefault();
    let file = $(event.target).prop('files')[0];
    let reader = new FileReader();
    reader.onload = function (event) {
      let uploadData = {};
      let data = new Uint8Array(reader.result);
      uploadData.data = data;
      uploadData.name = file.name;
      uploadData.type = file.type;
      uploadData.size = file.size;
      uploadData.perms = 'publicRead';
      tmpl.fileToUpload.set(uploadData);
    };
    reader.readAsArrayBuffer(file);
  }
});