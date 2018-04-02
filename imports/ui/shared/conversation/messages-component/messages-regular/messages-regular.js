import './messages-regular.html';

import { VZ } from '/imports/startup/both/namespace';
import { Messages } from '/imports/api/messages/messages';
import {getMessagesQuery, readAllMessages, sendMessage   } from '/imports/api/conversations/methods';
Template.messagesRegular.onCreated(function () {
    // default values
    this.messagesQuery = new ReactiveVar({});

    this.messagesListPageNumber = new ReactiveVar(0);
    this.isDno = false;

    this.actionOnMessagesReRendered = this.data.messageToScrollId
        ? 'scrollToMessageById' : 'scrollToBottom';
    this.wasScrolledToMessageById = false;
    this.allowLoadMore = true;

    let self = this;

    this.autorun(() => {
        let pageNumber = this.messagesListPageNumber.get();

        let processResult = function (err, res) {
            if (err) {
                VZ.notify(err);
            } else {
                let query = {
                    conversationId: self.data.conversation._id,
                    'deletedBy.participantId': {$ne: Meteor.userId()}
                };

                if (!res) {
                    query = _.omit(query, 'sentAt');
                }
                else {
                    _.extend(query, res.query);
                    self.isDno = res.isDno;

                    if (_.isNumber(res.pageNumber)) {
                        self.messagesListPageNumber.curValue = res.pageNumber;
                    }
                }

                self.messagesQuery.set(query);
            }
        };
        let dataconversationId = self.data.conversation._id;
        let datamessageToScrollId = self.data.messageToScrollId;

        if (this.data.messageToScrollId && !this.wasScrolledToMessageById) {
            getMessagesQuery.call({conversationId: dataconversationId, messageIdOrPageNumber: pageNumber, computeFromId: datamessageToScrollId}, processResult);
        } else {
            getMessagesQuery.call({conversationId: dataconversationId, messageIdOrPageNumber: pageNumber, processResult});
        }
    });

    this.autorun(() => {
        let query = this.messagesQuery.get();
        if (!_.isEmpty(query)) {
            this.subscribe('messages', query);
        }
    });

    this.readAllMessages = _.debounce(function () {
        let dataconversationId = self.data.conversation._id;
        readAllMessages.call({conversationId: dataconversationId});
    }, 1000, true);
    this.readAllMessages();

    this.loadMessages = _.debounce(function (olderMessages) {
        let isDno = self.isDno;
        if (olderMessages && isDno) {
            return;
        }

        let currVal = self.messagesListPageNumber.get();
        let newVal = olderMessages ? ++currVal : --currVal;
        newVal = newVal < 0 ? 0 : newVal;
        self.messagesListPageNumber.set(newVal);
    }, 300, true);
});

Template.messagesRegular.onRendered(function () {
    let self = this;
    let targetMessage = null;
    let lastTopMessageId = null;

    this.afterAllMessagesReRendered = function () {
        let $scrollableContent = self.$('.scrollable-content');
        let action = self.actionOnMessagesReRendered;

        switch (action) {
            case 'scrollToLastTop':
                self.actionOnMessagesReRendered = null;
                targetMessage = self.$('#' + lastTopMessageId);
                if (targetMessage.length > 0) {
                    $scrollableContent.scrollTo(targetMessage[0]);
                }
                lastTopMessageId = self.$('.top-message').attr('id');
                break;
            case 'scrollToLastBottom':
                lastTopMessageId = self.$('.top-message').attr('id');
                break;
            case 'scrollToBottom':
                lastTopMessageId = self.$('.top-message').attr('id');

                let bottomPosition = $scrollableContent.prop('scrollHeight');
                $scrollableContent.scrollTop(bottomPosition);
                self.allowLoadMore = true;
                break;
            case 'scrollToMessageById':
                self.actionOnMessagesReRendered = null;
                self.wasScrolledToMessageById = true;
                targetMessage = self.$('#' + self.data.messageToScrollId);
                if (targetMessage.length > 0) {
                    $scrollableContent.scrollTo(targetMessage[0]);
                }
                lastTopMessageId = self.$('.top-message').attr('id');
                break;
        }
    }
});

Template.messagesRegular.helpers({
    messages() {
        let tmpl = Template.instance();
        let query = tmpl.messagesQuery.get();

        return Messages.find(query, {sort: {sentAt: -1}});
    },

    isMessagesReady() {
        let tmpl = Template.instance();
        let query = tmpl.messagesQuery.get();

        return !_.isEmpty(query);
    },

    oldestMessageId() {
        let tmpl = Template.instance();
        let query = tmpl.messagesQuery.get();
        let message = Messages.findOne(query, {sort: {sentAt: 1}});
        return message ? message._id : null;
    },

    afterAllMessagesReRenderedCb() {
        let tmpl = Template.instance();

        return tmpl.afterAllMessagesReRendered ?
            tmpl.afterAllMessagesReRendered : function () {
            }
    }
});

Template.messagesRegular.events({
    'keypress .message-input': function (event, tmpl) {
        if (event.keyCode == 13) {
            let text = event.target.value;
            if (text.length > 0) {
                let conversationId = tmpl.data.conversation._id;
                sendMessage.call({conversationId, messageText: text}, (error) => {
                    if (error) {
                        VZ.notify(error.message);
                    } else {
                        $(event.target).val('');
                        tmpl.allowLoadMore = false;
                        tmpl.messagesListPageNumber.set(0);
                        tmpl.actionOnMessagesReRendered = 'scrollToBottom';
                        setTimeout(function () {
                            tmpl.allowLoadMore = true;
                        }, 1000);
                    }
                });
            }
        }
    },

    'click .message-input': function (event, tmpl) {
        tmpl.readAllMessages();
    },

    'scroll .scrollable-content': function (event, tmpl) {
        tmpl.readAllMessages();

        if (!tmpl.allowLoadMore) {
            return;
        }

        let $scrollableContent = $(event.target);
        let scrollTop = event.target.scrollTop;
        let scrollHeight = $scrollableContent.prop('scrollHeight');
        let bottomScrollPosition = scrollHeight - $scrollableContent.height();

        if (scrollTop == 0) {
            tmpl.loadMessages(true);
            tmpl.actionOnMessagesReRendered = 'scrollToLastTop';
        } else if (scrollTop == bottomScrollPosition) {
            tmpl.loadMessages(false);
            tmpl.actionOnMessagesReRendered = 'scrollToLastBottom';
        } else {
            tmpl.actionOnMessagesReRendered = 'null';
        }

    }
});