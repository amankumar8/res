import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import { ScreenRecords, ScreenRecordsSchema } from './screenRecords';
import { Screenshots } from '/imports/api/screenShots/screenShots';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { uploadVideo } from '/imports/api/google-services/google-api/methods';

export const uploadScreenRecord = new ValidatedMethod({
    name: 'screenRecords.uploadScreenRecord',
    validate: null,
    run({buffer, type}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('screenRecords.uploadScreenRecord.notLoggedIn',
                'Must be logged in.');
        }
        let index = ScreenRecords.find({userId: userId}).count() + 1;

        let params = {
            name: userId+'/'+index,
            type: type,
            buffer: buffer,
            bucketName: 'vezio_screen_recordings'
        };
        try {
            let mediaLink = uploadVideo.call(params);
            ScreenRecords.insert({
                userId: userId,
                index: index,
                link: mediaLink
            });
        } catch (e) {
            return e;
        }
    }
});

export const deleteScreenshot = new ValidatedMethod({
    name: 'sreenshot.deleteScreenshot',
    validate: new SimpleSchema({
        id: {type: String}
    }).validator(),
    run({id}) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('sreenshot.deleteScreenshot.notLoggedIn',
                'Must be logged in.');
        }

        let screenshot = Screenshots.findOne({_id: id});
        let timeEntry = TimeEntries.findOne({_id: screenshot.timeEntryId});
        if (timeEntry.userId != userId) {
            throw new Meteor.Error('sreenshot.deleteScreenshot.permissionError',
                'You are not screenshot owner');
        }
        let timeEntryStartDate = moment(timeEntry.startDate).toDate();
        let timeEntryTimeTracked = timeEntry._totalMinutes;
        let screenShoots = Screenshots.find({
            timeEntryId: timeEntry._id
        }, {$sort: {takenAt: 1}}).fetch();

        let notDeleted = _.reject(screenShoots, function (screen) {
            return _.has(screen, 'deleted') && screen.deleted;
        });
        if (timeEntryTimeTracked == 0) {
            Screenshots.update({_id: id}, {$set: {deleted: true}});
        }
        else if (notDeleted.length == 1) {
            Screenshots.update({_id: id}, {$set: {deleted: true}});
            TimeEntries.update({_id: timeEntry._id}, {$set: {_totalMinutes: 0}});
        }
        else {
            for (let i = 0; i < screenShoots.length; i++) {
                if (screenShoots[i - 1] && screenShoots[i - 1]._id && screenShoots[i]._id == id) {
                    let previousScreenDate = moment(screenShoots[i - 1].takenAt).toDate();
                    let currentScreenDate = moment(screenShoots[i].takenAt).toDate();
                    let screenTrackedTime = Math.abs(moment(currentScreenDate).diff(previousScreenDate, 'minutes'));
                    let newTimeEntryTrackedTime = timeEntryTimeTracked - screenTrackedTime;
                    Screenshots.update({_id: id}, {$set: {deleted: true}});
                    TimeEntries.update({_id: timeEntry._id}, {$set: {_totalMinutes: newTimeEntryTrackedTime}});
                }
                else if (screenShoots[i]._id == id) {
                    let currentScreenDateP = moment(screenShoots[i].takenAt).toDate();
                    let diff = Math.abs(moment(currentScreenDateP).diff(timeEntryStartDate, 'minutes'));
                    let newTimeEntryTrackedTime = timeEntryTimeTracked - diff;
                    Screenshots.update({_id: id}, {$set: {deleted: true}});
                    TimeEntries.update({_id: timeEntry._id}, {$set: {_totalMinutes: newTimeEntryTrackedTime}});
                }
            }
        }
    }
});