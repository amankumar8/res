import { VZ } from '/imports/startup/both/namespace';
import { Conversations } from '/imports/api/conversations/conversations';
import { openConversationWindow, createPrivateConversation } from '/imports/api/conversations/methods';
import './start-conversation.html';

Template.startConversation.events({
    'click .start-conversation-icon': function (event, tmpl) {
        let participantId = tmpl.data.participantId;
        let existingConversation = Conversations.findOne({
            isPrivate: true,
            participantsIds: {$all: [participantId, Meteor.userId()]}
        });

        if (existingConversation) {
            openConversationWindow.call({conversationId: existingConversation._id});
        } else {
            createPrivateConversation.call({participantId}, function (err, res) {
                if (err) {
                    VZ.notify(err.message);
                } else {
                    openConversationWindow.call({conversationId: res});
                }
            });
        }
    }
});