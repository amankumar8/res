import { Messages } from '/imports/api/messages/messages';
import './conversation-item.html';
import { openConversationWindow } from '/imports/api/conversations/methods';

Template.conversationItem.onCreated(function () {
    this.subscribe('unreadMessages', this.data.conversation._id);

    // subscribe on last message
    this.autorun(() => {
        this.subscribe('messages', this.data.conversation._id,
            {limit: 1, sort: {sentAt: -1}});
    });
});

Template.conversationItem.helpers({
    lastMessage() {
        let conversationId = this.conversation._id;
        return Messages.findOne({
            conversationId: conversationId,
            'deletedBy.participantId': {$ne: Meteor.userId()}
        }, {sort: {sentAt: -1}});
    },
    hasUnreadMessages() {
        let conversationId = this.conversation._id;
        return Messages.find({
                conversationId: conversationId,
                'readBy.participantId': {$ne: Meteor.userId()}
            }).count() > 0;
    },

    messageDate(sentAt) {
        if (moment(sentAt).startOf('day').toString()
            == moment().startOf('day').toString()) {
            return moment(sentAt).format('HH:mm');
        } else if (moment(sentAt).startOf('week').toString()
            == moment().startOf('week').toString()) {
            return moment(sentAt).format('dddd');
        } else if (moment(sentAt).startOf('year').toString()
            == moment().startOf('year').toString()) {
            return moment(sentAt).format('MM.DD');
        } else {
            return moment(sentAt).format('MM.DD.YY');
        }
    },

    // for group conversation
    otherParticipantsIds() {
        let allParticipantsIds = this.conversation.participantsIds.slice(0);
        allParticipantsIds.push(this.conversation.ownerId);
        return _.reject(allParticipantsIds, function (partId) {
            return partId == Meteor.userId();
        }).slice(0, 4);
    },

    // for lib
    participantId() {
        let allParticipants = this.conversation.participantsIds.slice(0);
        return _.reject(allParticipants, function (partId) {
            return partId == Meteor.userId();
        })[0];
    }
});

Template.conversationItem.events({
    'click li': function (event, tmpl) {
        let conversationId = tmpl.data.conversation._id;
        openConversationWindow.call({conversationId});
    }
});