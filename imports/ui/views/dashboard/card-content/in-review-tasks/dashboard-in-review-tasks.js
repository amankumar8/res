import { Contracts } from '/imports/api/contracts/contracts';
import './dashboard-in-review-tasks.html';

Template.dashboardCardInReviewTasks.onCreated(function () {
    this.query = new ReactiveVar('name');
    this.autorun(() => {
    });
});

Template.dashboardCardInReviewTasks.onRendered(function () {
    this.$('.dropdown-button').dropdown();
});

Template.dashboardCardInReviewTasks.helpers({
    query() {
        return Template.instance().query.get();
    },
    contractedUsers() {
        let contracts = Contracts.find({employerId: Meteor.userId()}).fetch();
        let workersIds = _.map(contracts, function (contract) {
            return contract.workerId;
        });
        return Meteor.users.find({_id: {$in: workersIds}}).fetch();
    },
    showUsers() {
        let tmpl = Template.instance();
        return tmpl.data.content;
    }
});

Template.dashboardCardInReviewTasks.events({
    'change input[type=radio]': function (event, tmpl) {
        event.preventDefault();
        let name = event.target.className;
            tmpl.query.set(name);
    },
    'click .dropdown-content': function (event, tmpl) {
        event.stopPropagation();
    }
});
