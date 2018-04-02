import './dashboard-card-spendings-earnings.html';

Template.dashboardCardSpendingsEarnings.onCreated(function () {
    this.query = new ReactiveVar({});
    this.autorun(() => {
        let data = Template.currentData();
        let title = data && data.title;
        this.query.set({title: title});
    });
});

Template.dashboardCardSpendingsEarnings.onRendered(function () {
    this.$('.dropdown-button').dropdown();
});

Template.dashboardCardSpendingsEarnings.helpers({
    query() {
        let query = Template.instance().query.get();
        return query;
    }
});

Template.dashboardCardSpendingsEarnings.events({
});
