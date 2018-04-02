import './images-dropzone.html';

import { VZ } from '/imports/startup/both/namespace';
import { Tasks } from '/imports/api/tasks/tasks';
import { uploadTaskFileP } from '/imports/api/google-services/google-api/methods';
import Dropzone from 'dropzone/dist/dropzone';

Template.imagesDropZone.onCreated(function () {
    this.imagesToUpload = new ReactiveVar([]);
    this.autorun(() => {
        let data = Template.currentData();
        let newTaskFiles = data.newTaskFilesVar.get();
        this.imagesToUpload.set(newTaskFiles);
    });
});

Template.imagesDropZone.onRendered(function () {
    Dropzone.autoDiscover = false;

    let self = this;
    this.$('ul.tabs').tabs();

    let taskId = this.data.taskId;
    $('#imageslightgallery').lightGallery({
        autoplayControls: false,
        fullScreen: false,
        zoom: false,
        thumbnail: false
    });

    let dropzone = new Dropzone('#taskImagesAttachmentsForm', {
        url: "/target-url",
        addRemoveLinks: true,
        autoProcessQueue: true,
        maxFiles: 5,
        maxFilesize: 5,
        parallelUploads: 10,
        clickable: false,
        dictDefaultMessage: '',
        previewsContainer: '.dropzone-previews',
        dictFileTooBig: 'File is to big ({{filesize}}MiB) and will not be uploaded! Max filesize: {{maxFilesize}}MiB.',
        dictMaxFilesExceeded: 'Can\'t add more than 5 files in a time',

        accept: function (file, done) {
            done();
        }

    });
    dropzone.on('maxfilesexceeded', function (file) {
        VZ.notify('Max upload  5 files in a time');
        dropzone.removeAllFiles();
    });
    dropzone.on('addedfile', function(file) {
        dropzone.removeFile(file);
        if (file.size >= 5 * 1000000) {
            VZ.notify('File ' + file.name + ' too large! Limit 5MB');
        }
        else {
            let reader = new FileReader();
            reader.onload = function (event) {
                let uploadData = {};
                let data = new Uint8Array(reader.result);
                uploadData.data = data;
                uploadData.name = file.name;
                uploadData.type = file.type;
                uploadData.size = file.size;
                uploadData.perms = 'publicRead';
                VZ.notify('Uploading files');
                uploadData.taskId = taskId;
                uploadTaskFileP.call(uploadData, function (error, result) {
                    if (result) {
                        VZ.notify('Uploaded ' + result.fileName);
                        if(taskId == 'new-task'){
                            self.data.onAddFilesCb(result);
                        }
                    }
                    else if (error) {
                        VZ.notify(error);
                    }
                });
            };
            let isImage = (/image\//g).test(file.type);

            if(isImage){
                reader.readAsArrayBuffer(file);
            }
            else {
                VZ.notify('Drop only images');

            }
        }
    });
    self.dropzone = dropzone;
});
Template.imagesDropZone.onDestroyed(function () {
    this.dropzone.destroy();
});

Template.imagesDropZone.helpers({
    isImage() {
        let fileName = this.fileName;
        return (/\.(gif|jpg|jpeg|tiff|png)$/i).test(fileName);
    },
    taskFiles() {
        let tmpl = Template.instance();
        let taskId = tmpl.data.taskId;
        let imagesToUpload = tmpl.imagesToUpload.get();
        let taskFiles;

        if(taskId == 'new-task'){
            taskFiles = imagesToUpload;
        }
        else {
            let task = Tasks.findOne({_id: taskId});
            taskFiles = task && task.taskFiles || [];
        }
        taskFiles = _.reject(taskFiles, function(file){ return file.type && file.type == 'video';});
        taskFiles = _.reject(taskFiles, function(file){ return !(/\.(gif|jpg|jpeg|tiff|png)$/i).test(file.fileName);});

        return taskFiles;
    }
});

Template.imagesDropZone.events({

});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};