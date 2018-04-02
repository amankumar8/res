import { Teams } from '../teams';
import { publishComposite } from 'meteor/reywood:publish-composite';

publishComposite('Teams', function (params = {}, options = {}) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    return {
        find: function () {
            switch (params.visibility) {
                case 'all':
                    _.extend(params, {
                        $or: [
                            {isPrivate: false},
                            {ownerId: userId},
                            {membersIds: userId}
                        ]
                    });
                    break;
                case 'public':
                    params.isPrivate = false;
                    break;
                case 'lib':
                    _.extend(params, {
                        isPrivate: true,
                        $or: [
                            {ownerId: userId},
                            {membersIds: userId}
                        ]
                    });
                    break;
            }
            params = _.omit(params, 'visibility');
            return Teams.find(params, options);
        },
        children: [
            {
                find: function (team) {
                    let userIds = team.membersIds || [];
                    return Meteor.users.find({_id: {$in: userIds}}, {fields: {profile: 1, roles: 1}});
                }
            }
        ]
    }
});