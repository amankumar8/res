import { Projects } from '../projects/projects.js';
import { Tasks } from '../tasks/tasks.js';

function findDocumentsWithoutTasksInfo() {
    const projects = Projects.find( { tasksInfo : { $exists : false } } ).fetch();

    let tasksInfo = {
        allUsers: {
            all: 0,
            completed: 0
        },
        individual: []
    };

    for (let i = 0; i < projects.length; i++) {
        Projects.update(projects[i]._id, { $set: { tasksInfo } });
    }
}

export const _recountAllUserTasks = function () {

    findDocumentsWithoutTasksInfo();

    let projects = Projects.find({}, { fields: {tasksInfo: 1} }).fetch();

    for (let i = 0; i < projects.length; i++) {
        let tasksInfo = projects[i].tasksInfo;

        let tasksCompleted = Tasks.find({projectId: projects[i]._id, status: 'Closed'}).count();
        let tasksAll= Tasks.find({projectId: projects[i]._id}).count();

        tasksInfo.allUsers.all = tasksAll;
        tasksInfo.allUsers.completed = tasksCompleted;

        Projects.update(projects[i]._id, { $set: { tasksInfo } });
    }
};

export const _recountIndividualTasks = function () {
    findDocumentsWithoutTasksInfo();

    let projects = Projects.find({}, { fields: {tasksInfo: 1, assignedUsersIds: 1} }).fetch();

    for (let i = 0; i < projects.length; i++) {
        let tasksInfo = projects[i].tasksInfo;

        if (projects[i].assignedUsersIds) {
            for (let j = 0; j < projects[i].assignedUsersIds.length; j++) {
                let userIndex = tasksInfo.individual.findIndex(track => track.userId === projects[i].assignedUsersIds[j]);
                if (userIndex === -1) {
                    tasksInfo.individual.push({
                        userId: projects[i].assignedUsersIds[j],
                        all: 0,
                        completed: 0
                    });
                }
            }
        }

        for (let k = 0; k < tasksInfo.individual.length; k++) {
            let tasksCompleted = Tasks.find({projectId: projects[i]._id,
                $or: [{membersIds: tasksInfo.individual[k].userId}, {ownerId: tasksInfo.individual[k].userId}], status: 'Closed'}).count();
            let tasksAll= Tasks.find({projectId: projects[i]._id,
                $or: [{membersIds: tasksInfo.individual[k].userId}, {ownerId: tasksInfo.individual[k].userId}]}).count();

            tasksInfo.individual[k].all = tasksAll;
            tasksInfo.individual[k].completed = tasksCompleted;
        }
        Projects.update(projects[i]._id, { $set: { tasksInfo } });
    }
};

export const _addNewTask = function (taskId) {
    let task = Tasks.findOne({_id: taskId}, { fields: {projectId: 1, membersIds: 1, ownerId: 1}});

    let project = Projects.findOne({_id: task.projectId}, {fields : {tasksInfo: 1}});

    let tasksInfo = project.tasksInfo;

    tasksInfo.allUsers.all += 1;

    let ownerIndex = task.membersIds.findIndex(userId => userId === task.ownerId);

    if (ownerIndex === -1) {
        task.membersIds.push(task.ownerId);
    }

    for (let j = 0; j  < task.membersIds.length; j++) {
        let userIndex = tasksInfo.individual.findIndex(track => track.userId === task.membersIds[j]);
        if (userIndex === -1) {
            tasksInfo.individual.push({
                userId: task.membersIds[j],
                all: 0,
                completed: 0
            });
        }
    }

    for (let i = 0; i < tasksInfo.individual.length; i++) {
        tasksInfo.individual[i].all += 1;
    }

    Projects.update(project._id, { $set: { tasksInfo } });
};

export const _addCompleteTask = function (taskId) {
    let task = Tasks.findOne({_id: taskId}, { fields: {projectId: 1, membersIds: 1}});

    let project = Projects.findOne({_id: task.projectId}, {fields : {tasksInfo: 1}});

    let tasksInfo = project.tasksInfo;

    tasksInfo.allUsers.completed += 1;

    for (let i = 0; i < tasksInfo.individual.length; i++) {
        tasksInfo.individual[i].completed += 1;
    }
    Projects.update(project._id, { $set: { tasksInfo } });
};

export const _addUsersToTask = function (taskId, userIds) {
    let task = Tasks.findOne({_id: taskId}, { fields: {projectId: 1, membersIds: 1}});
    let project = Projects.findOne({_id: task.projectId}, {fields : {tasksInfo: 1}});

    let tasksInfo = project.tasksInfo;

    for (let j = 0; j  < userIds.length; j++) {
        let userIndex = tasksInfo.individual.findIndex(track => track.userId === userIds[j]);
        if (userIndex === -1) {
            tasksInfo.individual.push({
                userId: userIds[j],
                all: 1,
                completed: 0
            });
        } else {
            tasksInfo.individual[userIndex].all += 1;
        }
    }
    Projects.update(task.projectId, { $set: { tasksInfo } });
};

export const _removeUsersFromTask = function (taskId, userIds) {
    let task = Tasks.findOne({_id: taskId}, { fields: {projectId: 1, membersIds: 1}});
    let project = Projects.findOne({_id: task.projectId}, {fields : {tasksInfo: 1}});

    let tasksInfo = project.tasksInfo;

    for (let j = 0; j  < userIds.length; j++) {
        let userIndex = tasksInfo.individual.findIndex(track => track.userId === userIds[j]);
        tasksInfo.individual[userIndex].all -= 1;
    }
    Projects.update(task.projectId, { $set: { tasksInfo } });
};