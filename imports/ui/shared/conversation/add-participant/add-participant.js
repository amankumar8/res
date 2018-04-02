import './find-users/find-users';
import './search-user-bar/search-user-bar';
import './add-participant.html';

import { VZ } from '/imports/startup/both/namespace';
import {createConversation, addParticipantsToConversation, openConversationWindow} from '/imports/api/conversations/methods';

Template.addParticipant.onCreated(function () {
    this.newParticipantsIds = new ReactiveArray([]);
    this.findUsersSearchString = new ReactiveVar('');
});

Template.addParticipant.onRendered(function () {
});

Template.addParticipant.onDestroyed(function () {
});

Template.addParticipant.helpers({
    findUsersSearchString() {
        return Template.instance().findUsersSearchString.get();
    },

    newAndAlreadyAddedParticipantsIds() {
        let newParticipantsIds = Template.instance().newParticipantsIds.list().array();
        return _.union(newParticipantsIds, this.conversation.participantsIds);
    },

    newParticipantsIds() {
        return Template.instance().newParticipantsIds.list();
    },

    onAddUserCb() {
        let tmpl = Template.instance();
        return function (userId) {
            tmpl.newParticipantsIds.push(userId);
            tmpl.$('.search-user-input').val('');
            tmpl.findUsersSearchString.set('');
        }
    },
    onRemoveUserCb() {
        let tmpl = Template.instance();
        return function (userId) {
            tmpl.newParticipantsIds.remove(userId);
        }
    }
});

Template.addParticipant.events({
    'input .search-user-input': _.throttle(function (event, tmpl) {
        setTimeout(function () {
            let $input = tmpl.$('.search-user-input');
            let value = $input.val();

            tmpl.findUsersSearchString.set(value);
        }, 50);
    }, 100),

    'click .cancel': function (event, tmpl) {
        tmpl.data.changeComponent('participantsList');
    },

    'click .save': function (event, tmpl) {
        let newParticipantsIds = tmpl.newParticipantsIds.array();

        // create public conversaion
        if (tmpl.data.conversation.isPrivate) {
            // participant from current conversation
            let participant = _.reject(tmpl.data.conversation.participantsIds,
                function (partId) {
                    return partId == Meteor.userId();
                });
            let participantsIds = _.union(newParticipantsIds, participant);
            let title = null;

            createConversation.call({title, participantsIds}, (error, res) => {
                if (error) {
                    VZ.notify(error.message);
                } else {

                    openConversationWindow.call({conversationId: res}, (error) => {
                        if (error) {
                            VZ.notify(error.message);
                        }
                        tmpl.data.changeComponent('messagesRegular');
                    });
                }
            });
        } else {
            let conversationId = tmpl.data.conversation._id;

            addParticipantsToConversation.call({conversationId, newParticipantsIds}, (err) => {
                if (err) {
                    VZ.notify(err.message);
                } else {
                    tmpl.data.changeComponent('messagesRegular');
                }
            });
        }
    }
});