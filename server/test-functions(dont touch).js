import { GoogleApi } from '/imports/api/google-services/server/google-api/connector';

export const wrapAsyncTest = function () {
    let Google = new GoogleApi();
    let file1 = {
        name: "some1",
        size: 2,
        data: "ab",
        type: "text/plain"
    };
    Google.uploadFile(file1, function (err, res) {
        if (err) {
            console.log(err);
            console.log("Bucket upload failed");
        }
        else {
            console.log(res.data.name);
        }
    });
};