import { VZ } from '/imports/startup/both/namespace';
import { Conversations } from '/imports/api/conversations/conversations';
import { sendMessage } from '/imports/api/conversations/methods';

import './send-message-footer.html';
import './modals/modals';


Template.sendMessageFooter.helpers({
    participantCount() {
        return this.conversation.participantsIds.length;
    },

    participantId() {
        return _.filter(this.conversation.participantsIds, function (id) {
            return id != Meteor.userId();
        })[0];
    }
});

Template.sendMessageFooter.events({
    'keypress .send-message-input': function (event, tmpl) {
        if (event.keyCode == 13) {
            let text = event.target.value;
            if (text.length > 0) {
                let conversationId = tmpl.data.conversation._id;
                sendMessage.call({conversationId: conversationId, messageText: text}, function (error, res) {
                    if (error) {
                        VZ.notify(error.message);
                    } else {
                        $(event.target).val('');
                    }
                });
            }
        }
    },
    'click .participant-avatar': function (event) {
        let participantId = event.target.id;
        Router.go('userProfile', {id: participantId});
    },
    'click .participant-count': function (event, tmpl) {
        let parentNode = $('body')[0];
        let data = function () {
            return {
                conversation: Conversations.findOne(tmpl.data.conversation._id)
            };
        };
        Blaze.renderWithData(Template.participantsListModal, data, parentNode);
    },
    'click .add-participant': function (event, tmpl) {
        let data = function () {
            return {
                conversation: Conversations.findOne(tmpl.data.conversation._id)
            };
        };
        let parentNode = $('body')[0];
        Blaze.renderWithData(Template.addParticipantModal, data, parentNode);
    }
});