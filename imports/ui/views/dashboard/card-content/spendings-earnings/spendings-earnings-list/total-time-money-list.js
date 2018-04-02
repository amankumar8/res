import { Tasks } from '/imports/api/tasks/tasks';

Template.totalTimeMoneyList.helpers({
    taskName() {
        let taskId = this.taskId;
        let task = Tasks.findOne({_id: taskId});
        let taskKeyName = task && task.taskKey +': ' + task.name;
        return taskKeyName;
    },
    isSpendingsCard() {
        let tmpl = Template.instance();
        let title = tmpl.data && tmpl.data.title;
        return title == 'Spendings';
    }
});