Router.map(function () {
    this.route('userProfile', {
        path: '/profile/:id',
        layoutTemplate: 'mainLayout',
        template: 'profileMain',
        waitOn: function () {
            let id = this.params.id;
            if (id !== Meteor.userId()) {
                return [
                    Meteor.subscribe('user', id)
                ]
            }
            return;
        },
        data: function () {
            return {
                pageTitle: 'Profile',
                userId: this.params.id
            }
        }
    });

    this.route('profile', {
        path: '/profile',
        waitOn: function () {
            this.redirect('userProfile', {id: Meteor.userId()});
        }
    })

});