import { Migrations } from 'meteor/percolate:migrations';

Meteor.methods({
    'migrateToLatest': function () {
        let currentMigrationVersion = Migrations.getVersion();
        let allMigrations = Migrations._list;
        let migrationIn2StepsForwardFromCurrent =
            _.find(allMigrations, function (migration) {
                return migration.version > currentMigrationVersion + 1;
            });

        if (!migrationIn2StepsForwardFromCurrent) {
            Migrations._collection.update({_id: 'control'}, {$set: {'locked': false}});
            Migrations.migrateTo('latest');
        } else {
            let errorMessage = 'You can\'t migrate more than one times with the same schema!';
            console.log(errorMessage);
            throw new Meteor.Error(errorMessage);
        }
    }
});