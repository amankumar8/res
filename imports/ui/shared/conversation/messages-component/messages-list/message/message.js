import './message.html';

Template.message.onRendered(function () {
    this.$('.avatar').tooltip();
});
Template.message.onDestroyed(function () {
    this.$('.avatar').tooltip('remove');
});

Template.message.helpers({
    isMyMessage() {
        return this.message.senderId == Meteor.userId();
    },

    participantsForWhomMessageIsLastReaded(messageId) {
        let lastReadBy = [];
        this.lastReadMessages.forEach(function (lastReadMessage) {
            if (lastReadMessage.messageId == messageId) {
                lastReadBy.push(lastReadMessage.readBy);
            }
        });

        return lastReadBy;
    },

    formattedMessage() {
        let addHyperLinks = function (string) {
            let formattedString = string;
            let urlRegEx = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?/gi;
            let url;
            while (url = urlRegEx.exec(rawText)) {
                if (url) {
                    let tag = '<a target="_blank" href="' + url[0] + '">' + url[0] + '</a>';
                    formattedString = formattedString.replace(url[0], tag);
                }
            }
            return formattedString;
        };

        let rawText = this.message.text;
        return addHyperLinks(rawText);
    }
});

Template.message.events({
});