import './add-participant/add-participant';
import './messages-component/messages-component';
import './participants-list/participants-list';
import './search-filter/search-filter';
import './settings/conversation-settings';
import './shared/shared';
import './conversation.html';
import './UI-helpers';
import { closeConversationWindow} from '/imports/api/conversations/methods';
Template.conversation.onCreated(function () {
    this.activeComponent = new ReactiveVar('messagesRegular');
    this.convWrapperPropsOnStart = new ReactiveVar(null);
    this.messageToScrollId = new ReactiveVar(null);
});

Template.conversation.onRendered(function () {
    this.$chatBox = this.$('.chat-box');
    this.$body = $('body');

    this.popUpConversationWindow = function () {
        let $otherWindows = $('.chat-box');
        $otherWindows.css('z-index', 1000);

        this.$chatBox.css('z-index', 1001);
    };
    this.popUpConversationWindow();
});

Template.conversation.onDestroyed(function () {
});

Template.conversation.helpers({
    activeComponent() {
        return Template.instance().activeComponent.get();
    },

    changeComponentCb() {
        let tmpl = Template.instance();
        return function (activeComponent) {
            tmpl.activeComponent.set(activeComponent);
            tmpl.messageToScrollId.set(null);
        }
    },

    scrollToMessageCb() {
        let tmpl = Template.instance();
        return function (messageId) {
            tmpl.activeComponent.set('messagesRegular');
            tmpl.messageToScrollId.set(messageId);
        }
    },

    messageToScrollId() {
        return Template.instance().messageToScrollId.get();
    },

    isWindowMoving() {
        return Template.instance().convWrapperPropsOnStart.get();
    }
});

Template.conversation.events({
    'click .close-conversation-window-icon': function (event, tmpl) {
        let dataconversationId = tmpl.data.conversation._id;

        closeConversationWindow.call({conversationId: dataconversationId});
    },
    'click .expand-conversation-icon': function (event, tmpl) {
        Router.go('conversation', {id: tmpl.data.conversation._id});
    },

    'mousedown .chat-box': function (event, tmpl) {
        tmpl.popUpConversationWindow();
    },

    'mousedown .chat-head': function (event, tmpl) {
        let mouseXOnStart = event.clientX;
        let mouseYOnStart = event.clientY;

        let $chatBox = tmpl.$chatBox;
        let windowLeftPosition = parseInt($chatBox.position().left);
        let windowTopPosition = parseInt($chatBox.position().top);

        let differenceX = mouseXOnStart - windowLeftPosition;
        let differenceY = mouseYOnStart - windowTopPosition;

        tmpl.convWrapperPropsOnStart.set({
            diffBetweenMouseAndLeftTop: {
                horizontal: differenceX,
                vertical: differenceY
            },
            conversationWrapperSize: {
                height: $chatBox.height(),
                width: $chatBox.width()
            }
        });

        tmpl.$body.addClass('non-selectable');
    },

    'mouseup .conversation-overlay, mouseup .chat-box': function (event, tmpl) {
        tmpl.convWrapperPropsOnStart.set(null);
        tmpl.$body.removeClass('non-selectable');
    },

    'mousemove': function (event, tmpl) {
        let convWrapperPropsOnStart = tmpl.convWrapperPropsOnStart.get();
        if (convWrapperPropsOnStart) {
            let checkPositionRelativeToBorders = function (positionLeft, positionTop) {
                // compute bottom and right positions
                let positionRight = positionLeft + convWrapperPropsOnStart.conversationWrapperSize.width;
                let positionBottom = positionTop + convWrapperPropsOnStart.conversationWrapperSize.height;

                let scrollTop = tmpl.$body.scrollTop();
                // check whether new position doesn't go beyond borders
                positionLeft = positionLeft >= 0 ? positionLeft : 0;
                positionTop = positionTop >= 55 + scrollTop ? positionTop : 55 + scrollTop;

                positionLeft = positionRight <= window.innerWidth ? positionLeft
                    : window.innerWidth - convWrapperPropsOnStart
                        .conversationWrapperSize.width;

                positionTop = positionBottom <= window.innerHeight + scrollTop ? positionTop
                    : window.innerHeight + scrollTop - convWrapperPropsOnStart
                        .conversationWrapperSize.height;

                return {
                    left: positionLeft,
                    top: positionTop
                }
            };
            let computeNewPosition = function () {
                let mouseX = event.clientX;
                let mouseY = event.clientY + tmpl.$body.scrollTop();

                // compute new left ant top position
                let positionLeft = mouseX -
                    convWrapperPropsOnStart.diffBetweenMouseAndLeftTop.horizontal;
                let positionTop = mouseY -
                    convWrapperPropsOnStart.diffBetweenMouseAndLeftTop.vertical;

                return checkPositionRelativeToBorders(positionLeft,
                    positionTop);
            };

            let newPosition = computeNewPosition();

            tmpl.$chatBox.offset(newPosition);
        }
    }

});