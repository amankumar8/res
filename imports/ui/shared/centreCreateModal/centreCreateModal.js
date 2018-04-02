import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import './centreCreateModal.html'

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

Template.centreCreateModal.onCreated(function () {
    this.tabsTemplateVar = new ReactiveVar(this.data.tabsTemplate);
    this.tabsTemplateDataVar = new ReactiveVar(Object.assign(this.data.tabsTemplateData || {}, { modalTemplate: this }));
    this.generalTemplateVar = new ReactiveVar(this.data.generalTemplate);
});

Template.centreCreateModal.onRendered(function() {
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

Template.centreCreateModal.helpers({
    getTabsTemplate() {
        return Template.instance().tabsTemplateVar.get();
    },
    getGeneralTemplate() {
        return Template.instance().generalTemplateVar.get();
    },
});
