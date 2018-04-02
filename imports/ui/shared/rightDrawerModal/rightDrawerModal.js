import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import './rightDrawerModal.html'

function delayedFunctionCall(conditionToStop, messageOnFail = "Delayed timeout", timeout = 5000, functionToCallOnSuccess) {
    const start = Date.now();
    const wait = setInterval(() => {
        if(conditionToStop) {
            stop();
            functionToCallOnSuccess();
        } else if(Date.now() - start > timeout) {
            stop();
            throw messageOnFail;
        }
    }, 100);

    function stop() {
        clearInterval(wait);
    }
}

Template.rightDrawerModal.onCreated(function () {
  this.tabsTemplateVar = new ReactiveVar(this.data.tabsTemplate);
  this.tabsTemplateDataVar = new ReactiveVar(Object.assign(this.data.tabsTemplateData || {}, { modalTemplate: this }));
  this.actionsTemplateVar = new ReactiveVar(this.data.actionsTemplate);
  this.headTemplateVar = new ReactiveVar(this.data.headTemplate);
  this.detailsTemplateVar = new ReactiveVar(this.data.detailsTemplate);
  this.asideTemplateVar = new ReactiveVar(this.data.asideTemplate);
  this.actionsTemplateDataVar = new ReactiveVar(Object.assign(this.data.actionsTemplateData || {}, { modalTemplate: this }));
  this.headTemplateDataVar = new ReactiveVar(Object.assign(this.data.headTemplateData || {}, { modalTemplate: this }));
  this.detailsTemplateDataVar = new ReactiveVar(Object.assign(this.data.detailsTemplateData || {}, { modalTemplate: this }));
  this.asideTemplateDataVar = new ReactiveVar(Object.assign(this.data.asideTemplateData || {}, { modalTemplate: this }));
});

Template.rightDrawerModal.onRendered(function() {
  this.$('.modal').modal();
  this.$('.modal').modal('open');
  const view = this.view;
  const condition = document.getElementsByClassName('modal-overlay').length > 0;
  function functionToCallOnSuccess() {
    const modalOverlay = document.getElementsByClassName('modal-overlay')[0];
    modalOverlay.addEventListener('click', () => Blaze.remove(view));
  }
  delayedFunctionCall(condition, 'Timeout waiting for modal overlay', 5000, functionToCallOnSuccess);
});

Template.rightDrawerModal.helpers({
  getGeneralClass() {
    return Template.instance().data.generalClass || '';
  },
  getTabsTemplate() {
    return Template.instance().tabsTemplateVar.get();
  },
  getActionsTemplate() {
    return Template.instance().actionsTemplateVar.get();
  },
  getHeadTemplate() {
    return Template.instance().headTemplateVar.get();
  },
  getDetailsTemplate() {
    return Template.instance().detailsTemplateVar.get();
  },
  getAsideTemplate() {
    return Template.instance().asideTemplateVar.get();
  },
  getTabsTemplateData() {
    return Template.instance().tabsTemplateDataVar.get();
  },
  getActionsTemplateData() {
    return Template.instance().actionsTemplateDataVar.get();
  },
  getHeadTemplateData() {
    return Template.instance().headTemplateDataVar.get();
  },
  getDetailsTemplateData() {
    return Template.instance().detailsTemplateDataVar.get();
  },
  getAsideTemplateData() {
    return Template.instance().asideTemplateDataVar.get();
  }
});

Template.rightDrawerModal.events({
  'click .modal-close': function(event, template) {
    $('.modal').modal('close');
    Blaze.remove(template.view);
  }
});
