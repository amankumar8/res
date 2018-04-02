import { Projects } from '/imports/api/projects/projects';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Tasks } from '../tasks';
import { publishComposite } from 'meteor/reywood:publish-composite';

//this publication is used only for dashboard assigned to me card
publishComposite('dashboardAssignedTasks', function () {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    let query = {membersIds: userId, archived: false};
  return {
    find: function () {
      return Tasks.find(query);
    },
    children: [
      {
        find: function (task) {
          return Projects.find({_id: task.projectId}, {fields: {name: 1}});
        }
      }
    ]
  }

});

Meteor.publish('tasksByType', function (query = {}, params = {}) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    return Tasks.find(query, params);
});

Meteor.publish('tasksCounts', function (projectId) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        projectId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({projectId});

        Counts.publish(this, 'all', Tasks.find({status: {$in: ['Opened', 'In-review']}, projectId: projectId, archived: false}));
        Counts.publish(this, 'assigned', Tasks.find({projectId: projectId, membersIds: userId, status: {$nin: ['In-review', 'Closed']}}));
        Counts.publish(this, 'in-review', Tasks.find({
            projectId: projectId,
            $or: [{membersIds: userId}, {ownerId: userId}],
            status: 'In-review'
        }));
        Counts.publish(this, 'completed', Tasks.find({
            status: 'Closed',
            $or: [{membersIds: userId}, {ownerId: userId}],
            archived: true,
            projectId: projectId
        }));
});

Meteor.publish('filterTasks', function (searchString, projectId) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        searchString: {
            type: String,
            optional: true
        },
        projectId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({searchString, projectId});

    const tasksFields = {
        sort: {createdAt: 1},
        limit: 15,
        fields: {
            taskFiles: 0,
            sendToInReview: 0,
            editedBy: 0,
            editedAt: 0
        }
    };

    let query = {
        projectId: projectId,
        $and: [{
            $or: [{
                ownerId: userId
            }, {
                membersIds: userId
            }]
        }],
        archived: false
    };
    if (searchString && searchString.trim().length > 0) {
        query.taskKey = {
            $regex: searchString, $options: 'gi'
        };
        return Tasks.find(query, tasksFields);
    } else {
        return Tasks.find(query, tasksFields);
    }
});

Meteor.publish('googleClientTasks', function (userId, projectId) {
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        projectId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        }
    }).validate({userId, projectId});

    return Tasks.find({
        $and: [
            {
                projectId: projectId
            },
            {
                $or: [
                    {ownerId: userId},
                    {membersIds: userId}
                ]
            }
        ]
    });
});
