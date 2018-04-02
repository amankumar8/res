UI.registerHelper('conversationTitle', function (conversation) {
    if (conversation.isPrivate) {
        let user = Meteor.users.findOne({
            _id: {
                $in: this.conversation.participantsIds,
                $ne: Meteor.userId()
            }
        });
        return user ? user.profile.fullName : null;
    } else {
        if (conversation.title) {
            return conversation.title;
        } else {
            let allParticipantsIds = conversation.participantsIds.slice(0);

            allParticipantsIds.push(conversation.ownerId);

            let otherParticipantsIds = _.reject(allParticipantsIds, function (partId) {
                return partId == Meteor.userId();
            });

            let otherParticipants = Meteor.users.find({_id: {$in: otherParticipantsIds}});

            let firstNames = _.map(otherParticipants.fetch(), function (participant) {
                return participant.profile.firstName;
            });

            return firstNames.join(', ');
        }
    }
});