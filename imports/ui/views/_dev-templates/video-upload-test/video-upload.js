import { VZ } from '/imports/startup/both/namespace';
import { uploadScreenRecord } from '/imports/api/screenRecords/methods';

import './video-upload.html';

Template.devVideoUpload.events({
    'change #videoInput': function (e, tmpl) {
        let file = $(e.target).prop('files')[0];

        let reader = new FileReader();
        reader.onload = function (event) {
            let buffer = new Uint8Array(reader.result);

            uploadScreenRecord.call({buffer:buffer,type:file.type}, (err, res) => {
                if (err) {
                    let message = err.reason || err.message;
                    console.log(message);
                    VZ.notify('Failed to upload video');
                } else {
                    VZ.notify('Video uploaded!');

                }
            });
        };
        reader.readAsArrayBuffer(file);
    }
});