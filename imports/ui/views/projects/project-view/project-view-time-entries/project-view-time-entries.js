import { VZ } from '/imports/startup/both/namespace';
import './project-view-time-entries.html';

Template.projectViewTimeEntries.onCreated(function () {
    let selectedUsersIds = this.data.selectedUsersIds;
    this.checkedUsersIds = new ReactiveArray(selectedUsersIds);

    // when selected users changes - change route
    this.autorun(() => {
        let checkedUsersIds = this.checkedUsersIds.list().array();
        let selectedUsersIdsString = checkedUsersIds.join(',');
        if (selectedUsersIdsString) {
            Router.go('viewProjectTimeEntries', {
                id: this.data.project._id,
                selectedUsersIds: selectedUsersIdsString
            });
        }
    });
});

Template.projectViewTimeEntries.onRendered(function () {
});

Template.projectViewTimeEntries.helpers({
    canSeeFilterByUsers() {
        let projectId = this.project._id;
        return VZ.canUser('seeFilterByUserInProject', Meteor.userId(), projectId);
    },

    isCheckedUserInFilter(userId) {
        return !!_.find(Template.instance().data.selectedUsersIds, function (selectedUserId) {
            return selectedUserId == userId;
        });
    },

    timeEntriesFilterParams() {
        let query = {
            projectId: this.project._id
        };

        let tmpl = Template.instance();
        let usersIds = tmpl.checkedUsersIds.list().array();
        if (usersIds.length > 0) {
            query.userId = {$in: usersIds}
        }

        return query;
    },

    assignedUsersToThisProject() {
        let assignedUsersIds = this.project.assignedUsersIds;
        return Meteor.users.find({_id: {$in: assignedUsersIds}});
    }
});

Template.projectViewTimeEntries.events({
    'change .filter-user-checkbox': function (event, tmpl) {
        let userId = event.target.id;
        let checked = event.target.checked;

        if (checked) {
            tmpl.checkedUsersIds.push(userId);
        } else {
            tmpl.checkedUsersIds.remove(userId);
        }
    }
});