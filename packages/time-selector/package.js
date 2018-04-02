/**
 * Created by andriimakar on 9/11/17.
 */
Package.describe({
    name: 'vezio:time-selector',
    version: '0.0.1',
    summary: '',
    git: ''
});


Package.onUse(function(api) {
    api.versionsFrom(['METEOR@1.0']);

    api.addFiles([
        'client/lib/js/datepicker.standalone.js',
        'client/lib/less/material-datetime-picker.less',
    ], 'client');
});
