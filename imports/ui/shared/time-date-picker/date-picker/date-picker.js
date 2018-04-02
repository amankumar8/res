import './year-picker/year-picker';
import './date-picker.html';

let FORMAT = 'DD/MM/YYYY';

Template.datePicker.onCreated(function() {
    let currentDate = Template.instance().data.date;
    if(!currentDate)  currentDate = new ReactiveVar(moment());
    this.date = currentDate;
    this.state = new ReactiveVar('calendar');
});

Template.datePicker.helpers({
    year: function() {
        let currentDate = Template.instance().date.get();
        return currentDate.year();
    },

    date: function() {
        let date = Template.instance().date.get();
        return date.format('ddd, MMM DD');
    },

    currentMonth: function() {
        let date = Template.instance().date.get();
        return date.format('MMMM YYYY');
    },

    daysOfTheWeek: function() {
        let daysLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        return daysLabels;
    },

    calendar: function() {
        let date = Template.instance().date.get(),
            month = date.month(),
            year = date.year(),
            calendar = getCalendar(month, year);

        return calendar;
    },

    isEmptyDay: function(day) {
        return day ? '' : 'empty';
    },

    isActiveDay: function(day) {
        let currentDate = Template.instance().date.get();
        if(currentDate.date() == day) return 'active';
        let newDate = currentDate.clone();
        //prevent to select future date
        newDate.date(day);
        if(moment().diff(newDate, 'days', true) < 0) return 'disabled';
    },

    years: function() {
        let currentYear = moment().year(),
            intervalSize = 5,
            startYear = currentYear - intervalSize,
            years = [];

        for(let i = 0; i<intervalSize; i++){
            years.push(startYear+i+1);
        }

        return years;
    },

    isCalendarState: function() {
        return Template.instance().state.get() === 'calendar';
    },

    selectedDateReactiveVar : function() {
        return Template.instance().date;
    },

    showControls : function() {
        let options = Template.instance().data.options;
        if(options && !options.showControls){
            return false;
        }
        let onSaved = typeof Template.instance().data.onSaved === 'function';
        return onSaved;
    }

});

Template.datePicker.events({
    'click .save-btn' : function(event, tmpl) {
        let onSaved = tmpl.data.onSaved;
        if(typeof onSaved === 'function'){
            onSaved(tmpl.date, tmpl.view);
        }
    },

    'click .cancel-btn' : function(event, tmpl) {
        let onCanceled = tmpl.data.onCanceled;
        if(typeof onCanceled === 'function'){
            onCanceled(tmpl.date, tmpl.view);
        }
        Blaze.remove(tmpl.view);
    },

    'click .date-year' : function(event, tmpl) {
        tmpl.$('.date-line').removeClass('active');
        tmpl.$('.date-year').addClass('active');
        tmpl.state.set('year');
    },

    'click .date-line' : function(event, tmpl) {
        tmpl.$('.date-line').addClass('active');
        tmpl.$('.date-year').removeClass('active');
        tmpl.state.set('calendar');
    },

    'click .pagination-left': function(event, tmpl) {
        let date = tmpl.date.get().subtract(1, 'months');

        tmpl.date.set(date);
    },

    'click .pagination-right': function(event, tmpl) {
        let date = tmpl.date.get(),
            newDate = date.clone();
            newDate.add(1, 'months');
        //prevent to select future date
        if(moment().diff(newDate, 'days', true) < 0) return ;

        tmpl.date.set(newDate);
    },

    'click .calendar-table td': function(event, tmpl) {
        let $element = $(event.target);

        if ($element.hasClass('empty') || $element.hasClass('disabled') ) return;

        let day = Number($element.text()),
            currentDate = tmpl.date.get();

        currentDate.date(day);
        tmpl.date.set(currentDate);

        $('.calendar-table td').removeClass('active');
        $element.addClass('active');

    }

});

function getCalendar(month, year) {
    let daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // get first day of month
    let firstDay = new Date(year, month, 1);
    let startingDay = firstDay.getDay();

    // find number of days in month
    let monthLength = daysInMonth[month];

    // compensate for leap year
    if (month == 1) { // February only!
        if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
            monthLength = 29;
        }
    }
    let calendar = [];

    // fill in the days
    let day = 1;
    // this loop is for weeks (rows)
    for (let i = 0; i < 9; i++) {
        let row = [];
        // this loop is for weekdays (cells)
        for (let j = 0; j <= 6; j++) {
            let currentDay = null;

            if (day <= monthLength && (i > 0 || j >= startingDay)) {
                currentDay = day;
                day++;
            }

            row.push(currentDay);
        }
        calendar.push(row);
        // stop making rows if we've run out of days
        if (day > monthLength) {
            break;
        }
    }
    return calendar;
}
