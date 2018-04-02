import './company-workers.html';

Template.companyDetailWorkers.onRendered(function () {
});

Template.companyDetailWorkers.helpers({
    companyWorkers: function () {
        let workers = this.company.workersIds;
        workers.unshift(this.company.ownerId);
        return workers;
    },
    
    companyId: function () {
        return Template.instance().data.company._id;
    }
});