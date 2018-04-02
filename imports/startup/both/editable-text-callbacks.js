import { updateProjectTime } from '/imports/api/projects/methods';
import { updateTask } from '/imports/api/tasks/methods';

EditableText.registerCallbacks({
    triggerAutoResize : function (doc) {
        $('textarea#editable-text-area').trigger('autoresize');
    },

    updateTaskTime: function (newlyInsertedDocument) {
        let taskId = newlyInsertedDocument && newlyInsertedDocument._id;
        if(taskId){
            updateTask.call({taskId:taskId}, (err, res) => {
                if (err) {
                    let message = err.reason || err.message;
                    console.log(message);
                }
            });
        }
    },
    updateProjectTime: function (newlyInsertedDocument) {
        let projectId = newlyInsertedDocument && newlyInsertedDocument._id;
        updateProjectTime.call({projectId:projectId}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.log(message);
            }
        });
    }
});