import './conversation-header.html';

import { Messages } from '/imports/api/messages/messages';

Template.conversationHeader.helpers({
    hasUnreadMessages() {
        let conversationId = this.conversation._id;
        return Messages.find({
                conversationId: conversationId,
                'readBy.participantId': {$ne: Meteor.userId()}
            }).count() > 0;
    }
});