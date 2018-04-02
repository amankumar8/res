import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Skills } from '/imports/api/skills/skills';

export const parseUpload = new ValidatedMethod({
    name: 'data.parseUpload',
    validate: null,
    run({data}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('data.parseUpload.notLoggedIn',
                'Must be logged in to view job.');
        }
        for (let i = 0; i < data.length; i++) {
            let item   = data[ i ];
            Skills.insert( item );
        }
    }
});