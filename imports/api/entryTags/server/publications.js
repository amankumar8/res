import { EntryTags } from '../entryTags';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Meteor.publish('tags', function (searchString) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        searchString: {
            type: String,
            optional: true
        }
    }).validate({ searchString });

    if (searchString && searchString.trim().length > 0) {
        return EntryTags.find({
            userId: userId,
            name: {
                $regex: searchString
            }
        })
    } else {
        return EntryTags.find({
            userId: userId
        })
    }
});

Meteor.publish('tagsForEntry', function (idArray) {
    const userId = this.userId;
    if (!userId) {
        return this.ready();
    }
    new SimpleSchema({
        idArray: {
            type: [String],
            regEx: SimpleSchema.RegEx.Id,
            optional: true
        }
    }).validate({idArray});

    return EntryTags.find({
        _id: {$in: idArray}
    });
});