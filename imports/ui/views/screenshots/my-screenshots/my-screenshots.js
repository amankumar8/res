import { VZ } from '/imports/startup/both/namespace';
import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import { Projects } from  '/imports/api/projects/projects';
import { Screenshots } from '/imports/api/screenShots/screenShots';
import './my-screenshots.html';
import { deleteScreenshot } from '/imports/api/screenRecords/methods';

Template.myScreenshots.onCreated(function () {
    this.searchQuery = new ReactiveVar({});
    this.timeFormat = new ReactiveVar('');
    this.datePickerDate = new ReactiveVar('');
    this.screens = new ReactiveVar([]);
    this.isReady = new ReactiveVar(false);

    this.getGreenWitchTime = (date) => {
        return moment(date.getTime() + (date.getTimezoneOffset() * 60000));
    };
    this.getTimeZoneName = (timeZone) => {
        let utc;
        let ownUtc = moment.tz.guess();
        switch (timeZone) {
            case 'current':
                utc = ownUtc;
                break;
            case 'utc':
                utc = 'Etc/Greenwich';
                break;
            case 'gmt':
                utc = 'Etc/GMT';
                break;
            case 'est':
                utc = 'EST';
                break;
            default:
                return false;
        }
        return utc;
    };
    this.getTimePeriod = (takenAt) => {
        let timeFormat = this.timeFormat.get() || '24';
        let minutes = moment(takenAt).get('minute');

        let momentTimeFormat;
        if (timeFormat == '12') {
            momentTimeFormat = 'hh';

        } else if (timeFormat == '24') {
            momentTimeFormat = 'HH';
        }
        let hours = moment(takenAt).get('hour');
        let hoursFormated = moment(hours, 'HH').format(momentTimeFormat);
        if(timeFormat == '12'){
            hoursFormated = parseInt(hoursFormated);
        }
        let period, hoursFormatedLast;

        if (minutes >= 0 && minutes < 10) {
            period = hoursFormated + ':' + '00' + ' - ' + hoursFormated + ':' + '10';
        }
        else if (minutes >= 10 && minutes < 20) {
            period = hoursFormated + ':' + '10' + ' - ' + hoursFormated + ':' + '20';
        }
        else if (minutes >= 20 && minutes < 30) {
            period = hoursFormated + ':' + '20' + ' - ' + hoursFormated + ':' + '30';
        }
        else if (minutes >= 30 && minutes < 40) {
            period = hoursFormated + ':' + '30' + ' - ' + hoursFormated + ':' + '40';
        }
        else if (minutes >= 40 && minutes < 50) {
            period = hoursFormated + ':' + '40' + ' - ' + hoursFormated + ':' + '50';
        }
        else if (minutes >= 50 && minutes < 60) {
            hoursFormatedLast = moment(parseInt(hoursFormated), 'hh').add(1, 'h').format(momentTimeFormat);
            period = hoursFormated + ':' + '50' + ' - ' + hoursFormatedLast + ':' + '00';
        }
        else {
            period = false;
        }
        return period;
    };
    this.getDayStartEndTime = (dayToShowScreenshots, timeZone) => {
        dayToShowScreenshots = dayToShowScreenshots.concat(' 00:00');
        let timeZoneName = this.getTimeZoneName(timeZone);

        let startOfDay = moment.tz(dayToShowScreenshots, timeZoneName).startOf('day').toDate();
        let endOfDay = moment.tz(dayToShowScreenshots, timeZoneName).endOf('day').toDate();

        return {
            startOfDay: startOfDay,
            endOfDay: endOfDay
        }
    };

    this.changeDay = (day) => {
        let date;
        let $input = this.$('.datepicker').pickadate();
        let picker = $input.pickadate('picker');
        let dayToShowScreenshots = this.data.dayToShowScreenshots.replace(/-/g, '/');
        let today = new Date(dayToShowScreenshots);
        let projectIds = this.data.projectIds;
        let timeZone = this.data.timeZone;
        let query = {project: projectIds};
        switch (day) {
            case 'yeasterday':
                date = new Date(today.setDate(today.getDate() - 1));
                break;
            case 'tomorrow':
                date = new Date(today.setDate(today.getDate() + 1));
                break;
            default:
                return false;
        }
        this.datePickerDate.set(date);
        picker.set('select', date, {format: 'd mmmm, yyyy'});
        let screenshotsDate = moment(date).format('YYYY-MM-DD');
        Router.go('screenshots', {screenshotsDate: screenshotsDate, timeZone: timeZone}, {query: query});
    };
    this.getScreenshotsTimeFormat = (timeFormat) => {
        return timeFormat == '12' ? 'h a' : 'HH';
    };

    this.autorun(() => {
        let data = Template.currentData();
        let dayToShowScreenshots = data.dayToShowScreenshots;
        let timeZone = data.timeZone;
        let projectIds = data.projectIds;

        let dayStartEndTime = this.getDayStartEndTime(dayToShowScreenshots, timeZone);
        let searchQuery = {};

        searchQuery.startDate = {
            $gte: dayStartEndTime.startOfDay,
            $lte: dayStartEndTime.endOfDay
        };

        if (projectIds.length > 0) {
            searchQuery.projectId = {$in: projectIds};
        }

        let projSub = this.subscribe('projects');
        let entriesSub = this.subscribe('timeEntriesAndScreenshots', searchQuery);
        if(projSub.ready() && entriesSub.ready()){
            this.isReady.set(true);
            this.searchQuery.set(searchQuery);
        }
    });
});

Template.myScreenshots.onRendered(function () {
    let dayToShowScreenshots = this.data.dayToShowScreenshots;

    $('select').material_select();
    this.$('.datepicker').pickadate({
        selectMonths: true,
        selectYears: 7,
        onStart: function () {
            return this.set('select', moment(dayToShowScreenshots).toDate(), {format: 'd mmmm, yyyy'});
        }
    });
    this.$('.dropdown-button').dropdown({
        belowOrigin: true
    });
    this.$('.modal-trigger').modal({
            dismissible: true,
            opacity: .5,
            in_duration: 200,
            out_duration: 1500
        }
    );
    this.datePickerDate.set($('.datepicker').val());
});

Template.myScreenshots.helpers({
    screenshots() {
        let userId = Meteor.userId();
        let tmpl = Template.instance();
        let dayToShowScreenshots = tmpl.data.dayToShowScreenshots;
        let timeZone = tmpl.data.timeZone;
        let searchQuery = tmpl.searchQuery.get();
        let timeFormat = tmpl.timeFormat.get() || '24';
        let screenshotsTimeFormat = tmpl.getScreenshotsTimeFormat(timeFormat);
        let dayStartEndTime = tmpl.getDayStartEndTime(dayToShowScreenshots, timeZone);
        let timeZoneName = tmpl.getTimeZoneName(timeZone);
        let offset = moment.tz(timeZoneName).utcOffset() / 60;
        searchQuery = _.extend(searchQuery, {userId});
        let timeEntries = TimeEntries.find(searchQuery, {sort: {startDate: 1}});
        let timeEntriesIds = timeEntries.map(function (timeEntry) {
            return timeEntry._id;
        });
        let timeEntriesAndTasks = timeEntries.map(function (timeEntry) {
            return {timeEntryId: timeEntry._id, taskName: timeEntry.message, _isActive: timeEntry._isActive};
        });
        let screenshots = Screenshots.find({
            timeEntryId: {$in: timeEntriesIds},
            takenAt: {
                $gte: dayStartEndTime.startOfDay,
                $lte: dayStartEndTime.endOfDay
            }
        }, {sort: {takenAt: 1}});
        let screenshotsWithTaskName = screenshots.map(function (screenshot) {
            let greenWitchTime = tmpl.getGreenWitchTime(screenshot.takenAt);
            screenshot.takenAt = greenWitchTime.add(offset, 'hours').toDate();
            _.each(timeEntriesAndTasks, function (element) {
                if (screenshot.timeEntryId == element.timeEntryId) {
                    screenshot.taskName = element.taskName;
                }
            });
            return screenshot;
        });
        let screenshotsByTimeGroup = _.groupBy(screenshotsWithTaskName, function (screenshot) {
            return moment(screenshot.takenAt).get('hour');
        });

        let timePeriods;
        _.each(screenshotsByTimeGroup, function (value, key) {
            if (value.length != 6) {
                let allPeriods = [];
                let step = 10;
                for (let i = 0; i < 6; i++) {
                    let newKey = _.clone(key);
                    if (newKey < 10 && newKey != 0) {
                        newKey = '0' + newKey;
                    }
                    else if (newKey == 0) {
                        newKey = '00';
                    }
                    if (i == 0) {
                        allPeriods.push(newKey + ':00');
                    }
                    else {
                        allPeriods.push(newKey + ':' + step);
                        step += 10
                    }
                }
                let date = moment(new Date(value[0].takenAt)).format('YYYY/MM/DD');
                timePeriods = _.map(value, function (screenshot) {
                    let time = moment(new Date(screenshot.takenAt)).format('YYYY/MM/DD HH:mm');
                    let isLess10 = moment(new Date(screenshot.takenAt)).get('minute');
                    let formated = moment(new Date(time));

                    let remainder = (10 - formated.minute()) % 10;
                    if (isLess10 < 10 && isLess10 >= 1) {
                        remainder = -isLess10;
                    }
                    return moment(new Date(formated)).add(remainder, 'minutes').format('HH:mm');
                });
                let relaxTimePeriods = _.difference(allPeriods, timePeriods);
                _.each(relaxTimePeriods, function (time) {
                    value.push({takenAt: moment(new Date(date + ' ' + time)).toDate(), deleted: true});
                    value.sort(function (a, b) {
                        return new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
                    });
                });
            }
        });

        let hours = _.keys(screenshotsByTimeGroup);
        let allScreens = _.map(hours, function (hour) {
            let screens;
            _.each(screenshotsByTimeGroup, function (value, key) {
                if (hour == key) {
                    screens = value;
                }
            });
            return {takenAt: moment(hour, 'hh').format(screenshotsTimeFormat), screens: screens}
        });
        tmpl.screens.set(allScreens);
        return allScreens;
    },
    projects() {
        let userId = Meteor.userId();
        return Projects.find({
            $or: [{assignedUsersIds: userId}, {ownerId: userId}]
        });
    },
    shouldShowChecked(val) {
        let projectIds = Template.instance().data.projectIds;
        let property = val['_id'];
        return _.isArray(projectIds) ? _.find(projectIds, function (item) {
            return item == property;
        }) : false;
    },
    datePickerDate() {
        let dayToShowScreenshots = Template.instance().datePickerDate.get();
        return moment(new Date(dayToShowScreenshots)).format('ddd, D MMMM YYYY');
    },
    selectedTimeZone(timeZoneFormat) {
        let timeZone = Template.instance().data.timeZone;
        return timeZone == timeZoneFormat ? 'selected' : '';
    },
    selectedTimeFormat(selectedTimeFormat) {
        let timeFormat = Template.instance().timeFormat.get() || '24';
        return selectedTimeFormat == timeFormat ? 'selected' : '';
    },
    screenshotTimePeriod() {
        let takenAt = this.takenAt;
        return Template.instance().getTimePeriod(takenAt);
    },
    getHours(takenAt) {
        // let regEx = new RegExp('/\d+\s(am|pm)/g');
        return takenAt.split(' ')[0];
    },
    getDayPeriod(takenAt) {
        return takenAt.split(' ')[1];
    },
    isScreensLoaded() {
        let tmpl = Template.instance();
        return tmpl.isReady.get();
    },
    isScreensFound() {
        let userId = Meteor.userId();
        let tmpl = Template.instance();
        let searchQuery = tmpl.searchQuery.get();
        let dayToShowScreenshots = tmpl.data.dayToShowScreenshots;
        let timeZone = tmpl.data.timeZone;
        let dayStartEndTime = tmpl.getDayStartEndTime(dayToShowScreenshots, timeZone);
        searchQuery = _.extend(searchQuery, {userId});

        let timeEntries = TimeEntries.find(searchQuery, {sort: {startDate: 1}});
        let timeEntriesIds = timeEntries.map(function (timeEntry) {
            return timeEntry._id;
        });
        let screenshots = Screenshots.find({
            timeEntryId: {$in: timeEntriesIds},
            takenAt: {
                $gte: dayStartEndTime.startOfDay,
                $lte: dayStartEndTime.endOfDay
            }
        }, {sort: {takenAt: 1}}).fetch();
        return screenshots.length > 0;
    }
});

Template.myScreenshots.events({
    'change .project-change': function (event, tmpl) {
        event.preventDefault();
        let timeZone = tmpl.data.timeZone;
        let dayToShowScreenshots = tmpl.data.dayToShowScreenshots;
        let projectIds = tmpl.data.projectIds;
        let checked = tmpl.$(event.currentTarget).prop('checked');
        let id = event.target.id;

        if (_.isArray(projectIds)) {
            if (checked) {
                projectIds.push(id);
            }
            else {
                projectIds = _.reject(projectIds, function (item) {
                    return item == id;
                });
            }
        } else {
            projectIds = [];
            projectIds.push(id);
        }
        let query = {project: projectIds};
        Router.go('screenshots', {screenshotsDate: dayToShowScreenshots, timeZone: timeZone}, {query: query});
    },
    'change .datepicker': function (event, tmpl) {
        event.preventDefault();
        let $input = tmpl.$('.datepicker').pickadate();
        let date = new Date($input.val());
        let screenshotsDate = moment(date).format('YYYY-MM-DD');
        let projectIds = tmpl.data.projectIds;
        let timeZone = tmpl.data.timeZone;
        let query = {project: projectIds};
        tmpl.datePickerDate.set($input.val());
        Router.go('screenshots', {screenshotsDate: screenshotsDate, timeZone: timeZone}, {query: query});
    },
    'click #previous-day': function (event, tmpl) {
        event.preventDefault();
        tmpl.changeDay('yeasterday');
    },
    'click #next-day': function (event, tmpl) {
        event.preventDefault();
        tmpl.changeDay('tomorrow');
    },
    'change #time-zone-select': function (event, tmpl) {
        event.preventDefault();
        let timeZone = tmpl.$('#time-zone-select option:selected').val();
        let projectIds = tmpl.data.projectIds;
        let dayToShowScreenshots = tmpl.data.dayToShowScreenshots;
        let query = {project: projectIds};
        Router.go('screenshots', {screenshotsDate: dayToShowScreenshots, timeZone: timeZone}, {query: query});
    },
    'change #time-format-select': function (event, tmpl) {
        event.preventDefault();
        let timeFormat = tmpl.$('#time-format-select option:selected').val();
        tmpl.timeFormat.set(timeFormat);
    },
    'click #delete-screenshot': function (event, tmpl) {
        event.preventDefault();
        let id = this._id;
        deleteScreenshot.call({id:id}, (err, res) => {
            if (err) {
                let message = err.reason || err.message;
                console.log(message);
                VZ.notify('Failed to delete');
            } else {
                VZ.notify('Screenshot deleted!');
            }
        });
    },
    'click .dropdown-content': function (event, tmpl) {
        event.stopPropagation();
    },
    'click #screenshot-img': function (event, tmpl) {
        event.preventDefault();
        let screenshot = this;
        let screens = tmpl.screens.get();
        let parentNode = $('body')[0],
            modalData = {
                screenshot: screenshot,
                screens: screens
            };
        if(this.screenshotOriginalURL){
            Blaze.renderWithData(Template.screenshotModal, modalData, parentNode);
        }
    }
});