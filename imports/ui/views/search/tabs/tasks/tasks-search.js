import { Tasks } from '/imports/api/tasks/tasks';
import './tasks-search.html';
import './task-item/task-item';

Template.tasksSearch.helpers({
    tasks: function () {
        return Tasks.find().fetch();
    }
});