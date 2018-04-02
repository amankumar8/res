import { Contracts } from '/imports/api/contracts/contracts';

Router.map(function () {
    this.route('contracts', {
        path: '/contracts',
        layoutTemplate: 'mainLayout',
        template: 'contractsList',
        waitOn: function () {
            return [
                this.subscribe('contractList')
            ];
        },
        data: function () {
            return {
                pageTitle: 'Contracts'
            }
        }
    });

    this.route('contract', {
        path: '/contracts/:id/view',
        layoutTemplate: 'mainLayout',
        template: 'contractView',
        waitOn: function () {
            return [
                this.subscribe('viewContract', this.params.id)
            ];
        },
        data: function () {
            return {
                pageTitle: 'Contracts',
                contract: Contracts.findOne(this.params.id)
            }
        }
    });

    this.route('createContract', {
        path: '/contracts/create',
        layoutTemplate: 'mainLayout',
        template: 'createEditContract',
        data: function () {
            return {
                pageTitle: 'Create contract'
            }
        }
    });

    this.route('editContract', {
        path: '/contracts/:id/edit',
        layoutTemplate: 'mainLayout',
        template: 'createEditContract',
        waitOn: function () {
            return [
                this.subscribe('editContract', this.params.id)
            ];
        },
        data: function () {
            return {
                pageTitle: 'Edit contract',
                contract: Contracts.findOne(this.params.id)
            }
        }
    });
});
