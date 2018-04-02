import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/percolate:synced-cron';
import { Contracts } from '../../contracts/contracts';
import publicHolidaysMethods from "../methods";

const { updateHolidays } = publicHolidaysMethods;

if (Meteor.isServer) {
  SyncedCron.add({
    name: 'update public holidays',
    schedule(parser) {
      return parser.cron('0 0 1 1 *');
    },
    job() {
      const contracts = Contracts.find({ 
        'paymentInfo.type': 'monthly', 
        $or: [
          { status: 'active' } 
        ]
      }, { countryCode: 1 }).fetch();
      const countryCodes = contracts.map(contract => contract.countryCode);
      updateHolidays.call({ countryCodes });
    }
  });
}
