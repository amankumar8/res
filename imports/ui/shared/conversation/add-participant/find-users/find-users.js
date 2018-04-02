import './added-user/added-user';
import './found-user-item/found-user-item';
import './find-users.html';

Template.findUser.onCreated(function () {
    // dynamic subscription on users
    this.autorun(() => {
        // subscribe on assignedUsers
        let participantsIds = Template.currentData().participantsIds;
        this.subscribe('assignedUsers', participantsIds);
    });
    this.autorun(() => {
        // subscribe by typed search string
        let searchString = Template.currentData().findUsersSearchString;
        this.subscribe('usersByNameOrEmailRegExp', searchString);
    });
});

Template.findUser.helpers({
    foundUsers() {
        let tmpl = Template.instance();

        let searchParams = {};

        let searchString = tmpl.data.findUsersSearchString;
        if (searchString != '') {
            searchString = searchString.replace(/[\(\)\[\\]/g, '');
            let searchStringRegExp = new RegExp(searchString, 'gi');
            searchParams.$or = [
                {'profile.fullName': {$regex: searchStringRegExp}},
                {'emails.address': {$regex: searchStringRegExp}}
            ];
        }

        let addedUsersIds = tmpl.data.participantsIds;
        // conversation owner shouldn't be in a list
        addedUsersIds.push(tmpl.data.conversation.ownerId);

        searchParams._id = {$nin: addedUsersIds};

        return Meteor.users.find(searchParams, {limit: 10});
    }
});

Template.findUser.events({
    'change input': function (event, tmpl) {
        if (event.target.checked) {
            tmpl.data.onAddUser(this._id);
        }
    }
});
