import { VZ } from '/imports/startup/both/namespace';
import { removeParticipantsFromConversation } from '/imports/api/conversations/methods';

import './participant-list-modal-item.html';

Template.participantsListModalItem.events({
    'click .remove-participant-icon': function (event, tmpl) {
        removeParticipantsFromConversation.call({conversationId: tmpl.data.conversationId, participantsIds: [tmpl.data.participant._id]}, function (err) {
                if (err) {
                    VZ.notify(err.message);
                }
            });
    }
});