import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import { VZ } from '/imports/startup/both/namespace';
import { startTrackingSite, checkIfScreenshotNeeded, uploadTakenScreenshot, stopTracking } from '/imports/api/timeEntries/methods';

let TimeTracker = function () {
    let _private = {
        _subscription: null,
        _subscriptionReady: new ReactiveVar(),
        _isRunning: new ReactiveVar(),
        _timeElapsed: new ReactiveVar(), //seconds
        _startedAt: null,
        _takeScreenshots: null,
        _screenshotDaemonHandle: null,
        _activeTimeEntryID: null,
        _timerIntervalHandler: null,

        _launchScreenshotDaemon: function () {

            let getRanromTakeScreenshotIntervalTime = function (minTime, maxTime) {
                minTime = minTime || 0.5;
                minTime *= 60 * 1000;
                maxTime = maxTime || 10;
                maxTime *= 60 * 1000;

                let time = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
                console.log('try to take next screenshot after ', time / 1000, ' seconds.');
                return time;
            };

            // stop previous daemon and start new
            _private._stopScreenshotDaemon();
            _private._screenshotDaemonHandle = setInterval(function () {
                //check if a screenshot already exists for this 10 minutes interval
                //if so - do not take screenshot
                checkIfScreenshotNeeded.call({timeEntryId: _private._activeTimeEntryID}, function (err, res) {
                        if (res) {
                            _private._takeScreenshot();
                        }
                        _private._launchScreenshotDaemon();
                    });
            }, getRanromTakeScreenshotIntervalTime(1 / 2, 10));

        },

        _stopScreenshotDaemon: function () {
            clearInterval(_private._screenshotDaemonHandle);
        },

        _takeScreenshot: function () {
            /* Start of defining callback functions */
            let takeScreenshotOfHtmlBody = function (canvas) {
                let readerOnLoad = function (e) {
                    let onScreenshotUploaded =
                        function (error, result) {
                            // add code for handling result
                        };

                    let arrayBuffer = new Uint8Array(this.result);

                    let screenshotParams = {
                        name: Meteor.userId() + '_' + moment().unix(),
                        type: 'image/png',
                        bucketName: 'vezio_timetracker_screenshots',
                        buffer: arrayBuffer
                    };

                    uploadTakenScreenshot.call({screenhotToUpload: screenshotParams, googleUserId: Meteor.userId()}, onScreenshotUploaded);
                };

                canvas.toBlob(function (blob) {
                    let reader = new FileReader();
                    reader.onload = readerOnLoad;
                    reader.readAsArrayBuffer(blob);
                    _private._showScreenshotMessage();
                });
            };
            /* End of defining callback functions */

            //Take the screenshot
            html2canvas(document.body, {
                onrendered: takeScreenshotOfHtmlBody
            });
        },

        _launchTimer: function () {
            //init the seconds
            Tracker.autorun(function () {
                _private._offset = TimeSync.serverOffset();
            });
            let currentClientTime = +new Date(),
                correctedTime = currentClientTime + _private._offset,
                seconds = Math.round(moment(correctedTime).diff(_private._startedAt) / 1000);

            _private._timeElapsed.set(seconds);
            _private._timerIntervalHandler = setInterval(function () {
                let correctedTime = +new Date() + _private._offset,
                    seconds = Math.round(moment(correctedTime).diff(_private._startedAt) / 1000);
                _private._timeElapsed.set(seconds);

            }, 1000);
        },

        _stopTimer: function () {
            clearInterval(_private._timerIntervalHandler);
        },

        _showScreenshotMessage: function () {
            //Todo add a preview UpWork style
            VZ.notify('Screenshot taken', 4000);
        }
    };

    _private._subscriptionReady.set(false);
    _private._isRunning.set(false);
    _private._timeElapsed.set(0);

    let cursor = TimeEntries.find({
        _isActive: true
    });

    cursor.observeChanges({
        added: function (id, fields) {
            _private._activeTimeEntryID = id;
            _private._startedAt = fields.startDate;
            _private._isRunning.set(true);
            _private._launchTimer();
            if (_private._takeScreenshots) {
                _private._launchScreenshotDaemon();
            }
        },
        //Erases the task
        removed: function (id) {
            _private._stopScreenshotDaemon();
            _private._stopTimer();
            _private._activeTimeEntryID = null;
            _private._isRunning.set(false);
            _private._timeElapsed.set(0);
        }
    });

    //Check if there is some task active
    _private._subscription = Meteor.subscribe('activeTimeEntry', function (error, response) {
        if (error) {
            console.log('Error checking singleton Entry : ', error);
        } else {
            _private._subscriptionReady.set(true);
        }
    });

    return {
        isReady: _private._subscriptionReady,
        isRunning: _private._isRunning,
        timeElapsed: _private._timeElapsed,
        startTracking: function (message, projectId, takeScreenshots, tags) {
            // if (!projectId) {
            // 	throw new Meteor.Error(
            // 		'You should select a project.');
            // }
            if (_private._activeTimeEntryID) {
                throw new Meteor.Error(
                    'You\'ve a task already in progress.');
            }
            _private._takeScreenshots = takeScreenshots;
            let query = {
                message: message,
                projectId: projectId,
                tags: tags,
                _done: false,
                _initiatedByDesktopApp: false,
                _trackedByDesktopApp: false
            };
            startTrackingSite.call(query, function (err) {
                if (err) {
                    VZ.notify(err);
                }
            });
        },
        stopTracking: function () {
            console.log('Stopping Id : ', _private._activeTimeEntryID);
            //Report ending time
            let entryId = _private._activeTimeEntryID;
            let userId = Meteor.userId();
            stopTracking.call({entryId: entryId, userId: userId}, function (err) {
                if (err) {
                    VZ.notify(err);
                }
                _private._stopScreenshotDaemon();
                _private._stopTimer();
                _private._activeTimeEntryID = null;
                _private._isRunning.set(false);
                _private._timeElapsed.set(0);
            });
        }
    };
};

VZ.TimeTracker.Utils = {
    TimeTracker: TimeTracker
};
