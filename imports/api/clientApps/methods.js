//client-app-id-handle
import { ClientApps } from './clientApps';
import {ValidatedMethod} from 'meteor/mdg:validated-method';

export const registerClientApp = new ValidatedMethod({
    name: 'clientApps.registerClientApp',
    validate: null,
    run() {
        return ClientApps.insert({
            lastUpdated: Date.now()
        });
    }
});

export const checkClientAppID = new ValidatedMethod({
    name: 'clientApps.checkClientAppID',
    validate: null,
    run(data) {
        let result = ClientApps.find({_id: data._id}).count() > 0;
        if(result === true) {
            ClientApps.update({_id: data._id}, {lastUpdated: Date.now()});
            return result;
        } else {
            ClientApps.remove({_id: data._id});
            // TODO in this case need also remove all authentications
            // with old clientAppId
            return ClientApps.insert({
                lastUpdated: Date.now()
            });
        }
    }
});