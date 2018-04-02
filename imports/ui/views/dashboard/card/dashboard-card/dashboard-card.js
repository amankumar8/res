import { Contracts } from '/imports/api/contracts/contracts';
import './dashboard-card.html';

Template.dashboardCard.onCreated(function () {
    this.query = new ReactiveVar({status: {$nin: ['Closed']}, membersIds: Meteor.userId()});
    this.autorun(() => {
        Template.currentData();
    });
});

Template.dashboardCard.onRendered(function () {
    this.$('.dropdown-button').dropdown();
});

Template.dashboardCard.helpers({
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
        return false;
    }
});

Template.dashboardCard.events({
    'change input[type=radio]': function (event, tmpl) {
        event.preventDefault();
        let name = event.target.className;
        let content = tmpl.data.content;
        if(content === 'dashboardTasksList'){
            if (name === 'assigned-to-me') {
                tmpl.query.set({status: {$nin: ['Closed']}, membersIds: Meteor.userId()});
            }
            else {
                tmpl.query.set({status: {$nin: ['Closed']}, $or: [{membersIds: name}, {ownerId: name}]});
            }
        }
    },
    'click .dropdown-content': function (event, tmpl) {
        event.stopPropagation();
    }
});