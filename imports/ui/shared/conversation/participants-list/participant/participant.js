import './participant.html';
import { removeParticipantsFromConversation } from '/imports/api/conversations/methods';
import { VZ } from '/imports/startup/both/namespace';
Template.participant.helpers({
    canRejectParticipant() {
        let conversationId = this.conversationId;
        return VZ.canUser('addParticipantToConversation', Meteor.userId(), conversationId);
    }
});

Template.participant.events({
    'click .remove-participant': function (event, tmpl) {
        removeParticipantsFromConversation.call({
            conversationId: tmpl.data.conversationId,
            participantsIds: [tmpl.data.participant._id]
        }, function (err) {
            if (err) {
                VZ.notify(err.message);
            }
        });
    }
});

