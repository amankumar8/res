import { Messages } from '/imports/api/messages/messages';
import './conversations-top-bar-icon.html';

Template.conversationsTopBarIcon.onCreated(function () {
    this.subscribe('unreadMessages');

    this.unreadMessagesCount = new ReactiveVar();
    this.autorun(() => {
        let count = Messages.find({
            'readBy.participantId': {$ne: Meteor.userId()}
        }).count();

        this.unreadMessagesCount.set(count);
    });
});

Template.conversationsTopBarIcon.onRendered(function () {

});

Template.conversationsTopBarIcon.helpers({
    unreadMessagesCount() {
        let count = Template.instance().unreadMessagesCount.get();
        return count > 10 ? '+10' : count;
    }
});