import './videos-dropzone.html';
import { VZ } from '/imports/startup/both/namespace';
import { Tasks } from '/imports/api/tasks/tasks';
import { addYoutubeVideo } from '/imports/api/tasks/methods';
import { uploadVideoP } from '/imports/api/google-services/google-api/methods';
import Dropzone from 'dropzone/dist/dropzone';

Template.videosDropZone.onCreated(function () {
    this.videosToUpload = new ReactiveVar([]);
    this.autorun(() =>{
        let data = Template.currentData();
        let newTaskFiles = data.newTaskFilesVar.get();
        this.videosToUpload.set(newTaskFiles);
    });
});

Template.videosDropZone.onRendered(function () {
    let self = this;

    this.$('ul.tabs').tabs();

    let taskId = this.data.taskId;

    $('#video-gallery').lightGallery({
        download:false,
        autoplay: false,
        autoplayControls: false,
        thumbnail: false,
        zoom: false,
        fullScreen: false,
        loadYoutubeThumbnail: true,
        youtubeThumbSize: 'default',
            youtubePlayerParams: {
                showinfo: 1,
                controls: 1
            }
    });


    Dropzone.autoDiscover = false;

    let dropzone = new Dropzone('form#taskVideoAttachmentsForm', {
        url: "/target-url",
        addRemoveLinks: true,
        autoProcessQueue: true,
        maxFiles: 1,
        maxFilesize: 15,
        parallelUploads: 2,
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
        VZ.notify('Max upload  1 file in a time');
        dropzone.removeAllFiles();
    });
    dropzone.on('addedfile', function(file) {
        dropzone.removeFile(file);
        if (file.size >= 15 * 1000000) {
            VZ.notify('File ' + file.name + ' too large! Limit 10MB');
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
                VZ.notify('Uploading video');
                uploadData.taskId = taskId;
                uploadVideoP.call(uploadData, function (error, result) {
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
            let isVideo = (/video\//g).test(file.type);
            if(isVideo){
                reader.readAsArrayBuffer(file);
            }
            else {
                VZ.notify('Only video required');

            }
        }
    });

    this.autorun(() => {
        Template.currentData();
    });
});
Template.videosDropZone.onDestroyed(function () {
});

Template.videosDropZone.helpers({
    isYouTubeVideo() {
        let fileName = this.mediaLink;
        return (/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g).test(fileName);
    },
    taskVideos() {
        let tmpl = Template.instance();
        let taskId = tmpl.data.taskId;
        let videosToUpload = tmpl.videosToUpload.get();
        let taskFiles;

        if(taskId == 'new-task'){
            taskFiles = videosToUpload;
        }
        else {
            let task = Tasks.findOne({_id: taskId});
            taskFiles = task && task.taskFiles || [];
        }
        taskFiles = _.filter(taskFiles, function(file){ return file.type && file.type == 'video' && !(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g).test(file.mediaLink);});
        return taskFiles;
    },
    youTubeVideos() {
        let tmpl = Template.instance();
        let taskId = tmpl.data.taskId;
        let videosToUpload = tmpl.videosToUpload.get();
        let taskFiles;

        if(taskId == 'new-task'){
            taskFiles = videosToUpload;
        }
        else {
            let task = Tasks.findOne({_id: taskId});
            taskFiles = task && task.taskFiles || [];
        }
        taskFiles = _.filter(taskFiles, function(file){ return file.type && file.type == 'video' && (/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g).test(file.mediaLink)});
        return taskFiles;
    }
});

Template.videosDropZone.events({
    'keyup #you-tube-url': function (event, tmpl) {
        event.preventDefault();
        if(event.keyCode == 13){
            let url = tmpl.$(event.currentTarget).val();
            let taskId = tmpl.data.taskId;

            addYoutubeVideo.call({url:url, taskId: taskId}, (err, res) => {
                if (err) {
                    let message = err.reason || err.message;
                    VZ.notify(message);
                    tmpl.$('#you-tube-url').val('');
                } else {
                    tmpl.$('#you-tube-url').val('');
                    if(taskId == 'new-task'){
                        tmpl.data.onAddFilesCb(result);
                    }
                }
            });
        }
    }
});