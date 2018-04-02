import { Projects } from '/imports/api/projects/projects';
import { VZ } from '/imports/startup/both/namespace';
import {projectUserPositions} from '/imports/startup/both/user-positions/project';

Router.map(function () {
    this.route('projects', {
        path: '/projects',
        layoutTemplate: 'mainLayout',
        template: 'projectsListNew',
        data: function () {
            return {
                pageTitle: 'Projects'
            }
        }
    });

    this.route('projectDashboard', {
        path: '/project/:id/dashboard/:tab?',
        layoutTemplate: 'mainLayout',
        action: function () {
            this.render('projectDashboard');
        },
        waitOn: function () {
            return [
                this.subscribe('projectInfo', this.params.id)
            ];
        },
        data: function () {
            let tasks =  Router.current().params.query && Router.current().params.query.tasks;
            let data = {
                pageTitle: '',
                tab: Router.current().params.tab,
                project: Projects.findOne(this.params.id)
            };
            if(tasks){
                data.tasks = tasks;
            }
            return data;
        }
    });
    /////////////////////////////////////////
    this.route('createProject', {
        path: '/projects/create',
        layoutTemplate: 'mainLayout',
        template: 'createEditProject',
        data: function () {
            return {
                pageTitle: 'Create project'
            }
        }
    });

    this.route('editProject', {
        path: '/projects/edit/:id',
        layoutTemplate: 'mainLayout',
        template: 'createEditProject',
        waitOn: function () {
            return [
                this.subscribe('editProject', this.params.id)
            ];
        },
        onBeforeAction: function () {
            if (VZ.canUser('editProject', Meteor.userId(), this.params.id)) {
                this.next();
            } else {
                Router.go('projects');
                VZ.notify('You have not permissions to view this page!');
            }
        },
        data: function () {
            return {
                project: Projects.findOne({_id: this.params.id}),
                pageTitle: 'Edit project'
            }
        }
    });

    // this.route('assignUsersToProject', {
    //     path: 'projects/assign-users/:id',
    //     layoutTemplate: 'mainLayout',
    //     template: 'assigningUsers',
    //     waitOn: function () {
    //         return this.subscribe('assignUsersToProject', this.params.id);
    //     },
    //     onBeforeAction: function () {
    //         let userId = Meteor.userId();
    //         let projectId = this.params.id;
    //         if (VZ.canUser('assignUserToProject', userId, projectId)) {
    //             this.next();
    //         } else {
    //             VZ.notify('You have not permissions to view this page!');
    //             Router.go('projects')
    //         }
    //     },
    //     data: function () {
    //         let projectId = this.params.id;
    //         return {
    //             params: {
    //                 methodForAssignUsersToEntityName: 'assignUsersToProject',
    //                 userPositions: projectUserPositions,
    //
    //                 backwardRoute: {
    //                     route: 'projects'
    //                 }
    //             },
    //             targetEntity: Projects.findOne({_id: projectId})
    //         }
    //     }
    // });

    this.route('assignTeamToProject', {
        path: '/projects/assign-team/:id',
        layoutTemplate: 'mainLayout',
        template: 'assignTeamToProjectOrCompany',
        waitOn: function () {
            return this.subscribe('assignTeamToProject', this.params.id);
        },
        onBeforeAction: function () {
            let userId = Meteor.userId();
            let projectId = this.params.id;
            if (VZ.canUser('assignTeamToProject', userId, projectId)) {
                this.next();
            } else {
                VZ.notify('You have not permissions to view this page!');
                Router.go('projects')
            }
        },
        data: function () {
            return {
                pageTitle: 'Assign team to the project',
                project: Projects.findOne(this.params.id)
            }
        }
    });
});
