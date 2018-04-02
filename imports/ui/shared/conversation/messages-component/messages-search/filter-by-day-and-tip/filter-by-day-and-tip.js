import './filter-by-day-and-tip.html';

Template.filterByDayAndTip.onCreated(function () {
    this.shouldShowTip = new ReactiveVar(true);
    this.filterByDayValue = new ReactiveVar('allTime');

    this.autorun(() => {
        this.data.onChangeFilterByDay(this.filterByDayValue.get());
    });
});

Template.filterByDayAndTip.onRendered(function () {
    this.$('.filter-dropdown').dropdown();
});

Template.filterByDayAndTip.helpers({
    shouldShowTip() {
        return Template.instance().shouldShowTip.get();
    },

    filterByDaySelectedValue() {
        switch (Template.instance().filterByDayValue.get()) {
            case 'allTime':
                return 'All Time';
            case 'today':
                return 'Today';
            case 'week':
                return 'This week';
            case 'month':
                return 'This month';
        }
    }
});

Template.filterByDayAndTip.events({
    'click .close-message': function (event, tmpl) {
        tmpl.shouldShowTip.set(false);
    },

    'click #filter-dropdown li': function (event, tmpl) {
        let value = event.currentTarget.id;
        tmpl.filterByDayValue.set(value);
    }
});