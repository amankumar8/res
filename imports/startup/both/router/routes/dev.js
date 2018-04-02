import { resetDb } from '/imports/api/users/dummy-methods';

Router.map(function () {
    this.route('styleguide', {
        path: '/styleguide',
        layoutTemplate: 'mainLayout',
        action: function () {
            this.render('styleguide');
        },
        data: function () {
            return {
                pageTitle: 'Style'
            }
        }
    });

    this.route('reset-db', {
        where: 'server',
        path: '/reset-db',
        onBeforeAction: function () {
            if (!Meteor.settings.isDev) {
                doResponse(this, 'This action can be executed only in dev mode');
            } else {
                this.next();
            }
        },
        action: function () {
            try {
                let res = resetDb.call({});
                if (res) {
                    doResponse(this, 'Success');
                } else {
                    doResponse(this, 'Something wrong');
                }
            } catch (error) {
                doResponse(this, error.message);
            }
        }
    });
    
    this.route('upload-video',{
        path: '/upload-video',
        layoutTemplate: "mainLayout",
        action: function () {
            this.render('devVideoUpload');
        },
        data: function () {
            return {
                pageTitle: 'Video upload testing'
            }
        }
    });
});

let doResponse = function (context, message) {
    let url = Router.url('home');
    let result = '<p>' + message + '</p><a href="' + url + '">Home</a>';
    context.response.writeHead(200, {'Content-type': 'text/html'});
    context.response.end(result);
};