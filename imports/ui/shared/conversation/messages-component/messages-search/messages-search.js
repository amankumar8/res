import './filter-by-day-and-tip/filter-by-day-and-tip';
import './search-message-bar/search-message-bar';
import './messages-search.html';

import { Messages } from '/imports/api/messages/messages';

Template.messagesSearch.onCreated(function () {
    this.shouldShowFilterSetting = new ReactiveVar(false);

    this.messageSearchParams = new ReactiveVar({
        conversationId: this.data.conversation._id,
        'deletedBy.participantId': {$ne: Meteor.userId()},
        text: ''
    });

    this.autorun(() => {
        const options = {
            sort: {sentAt: -1}
        };
        this.subscribe('messages', this.messageSearchParams.get(), options);
    });
});

Template.messagesSearch.helpers({
    foundMessages() {
        let params = Template.instance().messageSearchParams.get();
        return Messages.find(params, {sort: {sentAt: -1}});
    },

    foundMessagesNumber() {
        let params = Template.instance().messageSearchParams.get();
        return Messages.find(params).count();
    },

    shouldShowFilterSetting() {
        return Template.instance().shouldShowFilterSetting.get();
    },

    onChangeFilterByDay() {
        let tmpl = Template.instance();

        return function (value) {
            Tracker.nonreactive(function () {
                let currentParams = tmpl.messageSearchParams.get();
                switch (value) {
                    case 'allTime':
                        currentParams = _.omit(currentParams, 'sentAt');
                        break;
                    case 'today':
                        let startOfToday = moment().startOf('day').toDate();
                        currentParams.sentAt = {$gte: startOfToday};
                        break;
                    case 'week':
                        let startOfWeek = moment().startOf('week').toDate();
                        currentParams.sentAt = {$gte: startOfWeek};
                        break;
                    case 'month':
                        let startOfMonth = moment().startOf('month').toDate();
                        currentParams.sentAt = {$gte: startOfMonth};
                        break;
                }
                tmpl.messageSearchParams.set(currentParams);
            });
        }
    }
});

Template.messagesSearch.events({
    'click .search-back': function (event, tmpl) {
        tmpl.data.changeComponent('messagesRegular');
    },
    'click .search-filter': function (event, tmpl) {
        let currentVal = tmpl.shouldShowFilterSetting.get();
        tmpl.shouldShowFilterSetting.set(!currentVal);
    },

    // input text in search-input, that located in search-message-bar
    'input .search-input': _.debounce(function (event, tmpl) {
        let setMessageTextQueryParam = function (searchString) {
            let currnetParams = tmpl.messageSearchParams.get();

            if (searchString) {
                let regEx = {$regex: searchString, $options: 'gi'};
                currnetParams.text = regEx;
            } else {
                currnetParams.text = '';
            }

            tmpl.messageSearchParams.set(currnetParams);
        };

        let searchString = tmpl.$('.search-input').val();
        setMessageTextQueryParam(searchString);
    }, 500),

    // click on message item, that located in sub template
    'click .message-item': function (event, tmpl) {
        let messageId = event.currentTarget.id;

        // go to regular mode, and scroll to message that was clicked
        tmpl.data.scrollToMessage(messageId);
    }
});