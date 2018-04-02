import { SyncedCron } from 'meteor/percolate:synced-cron';
import summarizer from './Summarizer.js';
import { addTrackValue, subtractTrackValue, updateTrackValue } from './updateTrack.js';
import { periodMover } from './helpers/index';

if (Meteor.isServer) {
  SyncedCron.add({
    name: 'move tracks periods',
    schedule: function(parser) {
      return parser.text('at 00:00');
    },
    job: function () {
      periodMover();
    }
  });
}

export {
  summarizer,
  addTrackValue,
  subtractTrackValue,
  updateTrackValue
};
