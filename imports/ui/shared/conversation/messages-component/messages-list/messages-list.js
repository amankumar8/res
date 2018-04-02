import './message/message';
import './messages-list.html';

import { Messages } from '/imports/api/messages/messages';

Template.messagesList.onCreated(function () {
    // search last read message for each participant
    this.lastReadMessagesByEachUser = new ReactiveVar([]);
    this.autorun(() => {
        let conversation = this.data.conversation;
        let conversationId = conversation._id;
        let participantsIds = conversation.participantsIds.slice(0);
        participantsIds.push(conversation.ownerId);
        participantsIds = _.reject(participantsIds, function (id) {
            return id == Meteor.userId();
        });

        let lastReadMessages = [];
        participantsIds.forEach(function (participantId) {
            let lastReadMessage = Messages.findOne({
                conversationId: conversationId,
                'readBy.participantId': participantId
            }, {sort: {sentAt: -1}});
            if (lastReadMessage) {
                lastReadMessages.push({messageId: lastReadMessage._id, readBy: participantId});
            }
        });
        this.lastReadMessagesByEachUser.set(lastReadMessages);
    });
});

Template.messagesList.onRendered(function () {
    // if regular mode
    if (this.data.afterAllMessagesReRendered) {
        let afterMessagesRender = _.debounce(() => {
            this.data.afterAllMessagesReRendered();
        }, 200);

        this.autorun(() => {
            Template.currentData().messages.count();
            Tracker.afterFlush(function(){
                afterMessagesRender();
            });
        });
    }
});

Template.messagesList.helpers({
    messagesGroupByDays() {
        let messages = _.sortBy(this.messages.fetch(), function (message) {
            return message.sentAt;
        });

        let messagesGroupByDaysObj = _.groupBy(messages, function (message) {
            return moment(message.sentAt).startOf('day').format('YYYY-MM-DD');
        });

        let messagesGroupByDays = [];
        _.each(messagesGroupByDaysObj, function (value, key) {
            messagesGroupByDays.push({date: key, messages: value});
        });
        return messagesGroupByDays;
    },

    formatMessageGroupDate(date) {
        let compareMomentsByStartOf = function (moment1, moment2, startOf) {
            let moment1StartOf = moment(moment1).startOf(startOf);
            let moment2StartOf = moment(moment2).startOf(startOf);
            return moment1StartOf.diff(moment2StartOf, 'days') == 0;
        };


        let messageGroupMoment = moment(date);
        let currentMoment = moment();

        if (compareMomentsByStartOf(messageGroupMoment, currentMoment, 'day')) {
            return 'Today';
        } else if (compareMomentsByStartOf(messageGroupMoment, currentMoment, 'week')) {
            return messageGroupMoment.format('dddd');
        } else if (compareMomentsByStartOf(messageGroupMoment, currentMoment, 'year')) {
            return messageGroupMoment.format('MMMM DD');
        } else {
            return messageGroupMoment.format('MMMM DD, YYYY');
        }
    },

    lastReadMessagesByEachUser() {
        return Template.instance().lastReadMessagesByEachUser.get();
    }
});

Template.messagesList.events({});