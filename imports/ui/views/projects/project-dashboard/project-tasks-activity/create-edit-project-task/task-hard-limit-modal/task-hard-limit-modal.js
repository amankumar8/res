import './task-hard-limit-modal.html';
import { Tasks } from '/imports/api/tasks/tasks';
import {updateHardLimit} from '/imports/api/tasks/methods';
import { VZ } from '/imports/startup/both/namespace';

Template.taskHardLimitModal.onCreated(function () {
  this.formatSecondsAsTime = (seconds) => {
    if (seconds < 1) {
      return '00:00:00';
    }

    let hr = Math.floor(seconds / 3600);
    let min = Math.floor((seconds - (hr * 3600)) / 60);
    let sec = Math.floor(seconds - (hr * 3600) - (min * 60));

    if (hr) {
      if(hr <= 9){
        hr = '0'+hr;
      }
    } else {
      hr = '00'
    }
    if (min) {
      if(min <= 9){
        min = '0'+min;
      }
    } else {
      min = '00'
    }
    if (sec) {
      if(sec <= 9){
        sec = '0'+sec;
      }
    } else {
      sec = '00'
    }

    return hr + ':' + min + ':' + sec;
  }
});

Template.taskHardLimitModal.onRendered(function () {
  let self = this;
  this.$('#hard-limit-modal').modal();
  this.$('#hard-limit-modal').modal('open');


  this.autorun(() => {
    let data = Template.currentData();
    let taskId = data.taskId;
    let task = Tasks.findOne({_id: taskId});
    let hardLimit = task.hardLimit || 0;
    hardLimit = this.formatSecondsAsTime(parseInt(hardLimit/1000));
    this.$('#hard-limit-edit').val(hardLimit);
  });

  $('.modal-overlay').on('click', function () {
    removeTemplate(self.view);
  });
  document.addEventListener('keyup', function (e) {
    if (e.keyCode == 27) {
      removeTemplate(self.view);
    }
  });
});
Template.taskHardLimitModal.onDestroyed(function () {
  this.$('.modal-overlay').remove();
});

Template.taskHardLimitModal.helpers({
    hardLimit() {
      let taskId = Router.current().params.query.task;
      let task = Tasks.findOne({_id: taskId});
      console.log(task)
    }
});

Template.taskHardLimitModal.events({
  'click #close-hard-limit-modal': function (event, tmpl) {
    event.preventDefault();
    tmpl.$('#hard-limit-modal').modal('close');
    removeTemplate(tmpl.view);
  },
  'click #save-hard-limit'(event, tmpl){
    event.preventDefault();
    let hardLimitVal = tmpl.$('#hard-limit-edit').val();
    let typeRegEx = /^([0-9][0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/;
    if(!typeRegEx.test(hardLimitVal)){
      VZ.notify('Wrong format! Try HH:MM:SS');
      return;
    }
    let hardLimit = moment.duration(tmpl.$('#hard-limit-edit').val()).asMilliseconds();
    let taskId = tmpl.data && tmpl.data.taskId;
    updateHardLimit.call({taskId, hardLimit}, function (error, result) {
      if (error){
        VZ.notify(error.message);
      }
      else {
        tmpl.$('#hard-limit-modal').modal('close');
        removeTemplate(tmpl.view);
      }
    });
  }
});

let removeTemplate = function (view) {
  setTimeout(function () {
    Blaze.remove(view);
  }, 500);
};