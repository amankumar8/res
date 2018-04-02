import { Companies } from '/imports/api/companies/companies';
import { SyncedCron } from 'meteor/percolate:synced-cron';

if (Meteor.isServer) {
    let deleteCompany = function (id) {
        let companyToDelete = Companies.findOne({_id: id, status: 'archived'});
        if (companyToDelete) {
            let companyArminId = companyToDelete.ownerId;
            let companyWorkersIds = companyToDelete.workersIds;

            Roles.removeUsersFromRoles(companyArminId, 'company-owner', companyToDelete._id);
            Roles.removeUsersFromRoles(companyWorkersIds, 'company-workers', companyToDelete._id);
            return true;
        } else {
            throw new Meteor.Error('Company is not found or can\'t be deleted!');
        }
    };

    SyncedCron.add({
        name: 'Company deleting',
        schedule: function (parser) {
            // parser is a later.parse object
            return parser.text('at 00:00');
        },
        job: function () {
            let companies = Companies.find({status: 'archived'}).fetch(),
                currDate = moment();
            for (let i = 0; i < companies.length; i++) {
                let company = companies[i];
                let archivedAt = moment(company.archivedAt),
                    diff = currDate.diff(archivedAt, 'milliseconds'),
                    oneDay = 1000 * 60 * 60 * 24;

                if (diff >= oneDay * 60) {
                    deleteCompany(company._id);
                }
            }
        }
    });
}