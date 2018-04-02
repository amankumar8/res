import { Meteor } from 'meteor/meteor';
import { Projects } from '/imports/api/projects/projects';
import { Tasks } from '/imports/api/tasks/tasks';
import { Companies } from '/imports/api/companies/companies';
import { Teams } from '/imports/api/teams/teams';
import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

////////////////PUBLISH FUNCTIONS///////////////////////

let defineParams = function (query, limit) {
    let params = {
        regExp: new RegExp(query, "gi"),
        limitQuery: {}
    };
    if (limit) {
        params.limitQuery = {
            limit: limit
        };
    }

    return params
};

let users = function (query, limit) {
    let params = defineParams(query, limit);

    return Meteor.users.find({
        $or: [{
            'profile.fullName': {
                $regex: params.regExp
            }
        }, {
            'emails.address': {
                $regex: params.regExp
            }
        }]
    }, params.limitQuery);
};

let usersIdByQuery = function (query) {
    let usersList = users(query).fetch();
    return _.map(usersList, function (user) {
        return user._id;
    });
};

let companies = function (query, limit, userId) {
    let params = defineParams(query, limit);

    return Companies.find({
        $and: [{
            $or: [{
                ownerId: userId
            }, {
                assignedUsersIds: userId
            }, {
                isPrivate: false
            }]
        }, {
            name: {
                $regex: params.regExp
            }
        }],
        status: {$ne: "archived"}
    }, params.limitQuery);
};

let projects = function (query, limit, userId) {
    let params = defineParams(query, limit);
    let users = usersIdByQuery(query);
    return Projects.find({
        $and: [{
            $or: [{
                ownerId: userId
            }, {
                assignedUsersIds: userId
            }]
        }, {
            $or: [{
                assignedUsersIds: {
                    $in: users
                }
            }, {
                ownerId: {
                    $in: users
                }
            }, {
                name: {
                    $regex: params.regExp
                }
            }, {
                tags: {
                    $regex: params.regExp
                }
            }, {
                projectKey: {
                    $regex: params.regExp
                }
            }]
        }],
        archived: false
    }, params.limitQuery);
};

let tasks = function (query, limit, userId) {
    let params = defineParams(query, limit);
    let users = usersIdByQuery(query);
    return Tasks.find({
        $and: [{
            $or: [{
                ownerId: userId
            }, {
                membersIds: userId
            }]
        }, {
            $or: [{
                membersIds: {
                    $in: users
                }
            }, {
                ownerId: {
                    $in: users
                }
            }, {
                name: {
                    $regex: params.regExp
                }
            }, {
                taskKey: {
                    $regex: params.regExp
                }
            }, {
                tags: {
                    $regex: params.regExp
                }
            }]
        }]
    }, params.limitQuery);
};

let timetracker = function (query, limit, userId) {
    let params = defineParams(query, limit);

    return TimeEntries.find({
            _done: true,
            message: {
                $regex: params.regExp
            },
            userId: userId
        }, params.limitQuery);
};

let teams = function (query, limit, userId) {
    let params = defineParams(query, limit);
    let users = usersIdByQuery(query);

    return Teams.find({
        $and: [{
            $or: [{
                ownerId: userId
            }, {
                assignedUsersIds: userId
            }, {
                isPrivate: false
            }]
        }, {
            $or: [{
                name: {
                    $regex: params.regExp
                }
            }, {
                description: {
                    $regex: params.regExp
                }
            }, {
                assignedUsersIds: {
                    $in: users
                }
            }, {
                ownerId: {
                    $in: users
                }
            }]

        }]
    }, params.limitQuery)
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
Meteor.publish('allSearch', function (query) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        query: {
            type: String,
            optional: true        }
    }).validate({ query });

    let limit = 5;

    return [
        users(query, 6),
        companies(query, limit, userId),
        projects(query, limit, userId),
        timetracker(query, limit, userId),
        tasks(query, limit, userId),
        teams(query, limit, userId)
    ]

});

Meteor.publish('searchTab', function (query, template) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        query: {
            type: String,
            optional: true
        },
        template: {
            type: String,
            optional: true
        }
    }).validate({ query, template });

    let subscriptions = {
        companiesSearch: companies,
        usersSearch: users,
        projectsSearch: projects,
        timetrackerSearch: timetracker,
        tasks: tasks,
        teamsSearch: teams
    };

    return subscriptions[template](query, null, userId);
});

Meteor.publish('user', function (idOrEmail) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    return Meteor.users.find({
        $or: [
            {'_id': idOrEmail},
            {'emails.address': idOrEmail}
        ],
        'profile.isArchived': false,
        'profile.isBlocked': false
    }, {fields: {services: 0}});
});

Meteor.publish('userById', function (id) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    return Meteor.users.find({_id: id}, {fields: {services: 0}});
});

Meteor.publish('usersByNameOrEmailRegExp', function (searchString) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        searchString: {
            type: String,
            optional: true
        }
    }).validate({searchString});

    let searchParams = {};
    if (searchString && searchString.length > 0) {
        let searchStringRegExp = new RegExp(searchString, 'gi');
        searchParams.$or = [
            {'profile.fullName': {$regex: searchStringRegExp}},
            {'emails.address': {$regex: searchStringRegExp}}
        ];
    }

    return Meteor.users.find(searchParams, {limit: 10});
});

Meteor.publish('usersByNameOrEmailRegExpAlternative', function (searchString, limit, addQuery = {}, addOptions = {}) {
    if (!this.userId) {
        return this.ready();
    }
    new SimpleSchema({
        searchString: {
          type: String,
          optional: true
        },
        limit: {
          type: Number
        },
        addQuery: {
          type: Object,
          optional: true
        },
        addOptions: {
          type: Object,
          optional: true
        }
    }).validate({ searchString, limit });

    const query = Object.assign({
      'profile.isArchived': false,
      'profile.isBlocked': false
    }, addQuery);
    const options = Object.assign({
      limit
    }, addOptions);
    if (searchString) {
        const searchStringRegExp = new RegExp(searchString, 'gi');
        query.$or = [
            { 'profile.fullName': { $regex: searchStringRegExp } },
            { 'emails.address': { $regex: searchStringRegExp } }
        ];
    }

    return Meteor.users.find(query, options);
});

Meteor.publish('assignedUsers', function (ids) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        ids: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({ids});

    return Meteor.users.find({_id: {$in: ids, $ne: userId}});
});

Meteor.publish('userPresence', function (id) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        id: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({id});
    // Example of using a filter to publish only 'online' users:
    return UserPresences.find({userId: id}, {fields: {'createdAt': 1}});
});

Meteor.publish('userDetailNext', function (userId) {
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({userId});

    let user = Meteor.users.findOne({_id: userId});
    return Meteor.users.find({createdAt: {$gt: user.createdAt}, 'profile.isArchived': false, 'profile.isBlocked': false}, {
        sort: {createdAt: 1},
        limit: 1,
        fields: {'services': 0}
    });
});

Meteor.publish('userDetailPrev', function (userId) {
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({userId});

    let user = Meteor.users.findOne({_id: userId});
    return Meteor.users.find({createdAt: {$lt: user.createdAt}, 'profile.isArchived': false, 'profile.isBlocked': false}, {
        sort: {createdAt: -1},
        limit: 1,
        fields: {'services': 0}
    });
});
