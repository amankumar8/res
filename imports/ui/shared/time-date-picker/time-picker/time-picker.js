import './hours/hours';
import './minutes/minutes';
import './time-picker.html';

Template.timePicker.onCreated(function(){
    this.format = new ReactiveVar(12);
    let date = this.data.date;
    if(!date) {
        date = new ReactiveVar(moment());
    }
    this.date = date;
    let state = 'hours',
        hours = getHours(date),
        rotateAngle = getRotateAngle(state, hours);

    this.rotateAngle = new ReactiveVar(rotateAngle);
    this.state = new ReactiveVar(state);
    this.locked = false;
});

Template.timePicker.onRendered(function(){
    setState('hours', this);
    let date = this.date.get(),
        hours = getHours(date),
        state = this.state.get(),
        period = date.format('a');

    highlightAnalogValue(hours, state, this);
    this.$('.period.' + period).addClass('active');
});

Template.timePicker.events({
    'click .save-btn' : function(event, tmpl) {
        let onSaved = tmpl.data.onSaved;
        if(typeof onSaved == 'function'){
            onSaved(tmpl.date, tmpl.view);
        }
    },

    'click .cancel-btn' : function(event, tmpl) {
        let onCanceled = tmpl.data.onCanceled;
        if(typeof onCanceled == 'function'){
            onCanceled(tmpl.date, tmpl.view);
        }
        Blaze.remove(tmpl.view);
    },

    'click .digital-clock .hours' : function(event, tmpl) {
        setState('hours', tmpl);
    },

    'click .digital-clock .minutes' : function(event, tmpl) {
        setState('minutes', tmpl)
    },

    'click .analog-period, click .digital .period' : function (event, tmpl) {
        let period = event.target.dataset.period,
            date = tmpl.date.get(),
            hours = Number(date.format('h')),
            hoursIn24Format = format12to24(hours, period);

        date.hours(hoursIn24Format);
        tmpl.date.set(date);

        tmpl.$('.period.active').removeClass('active');
        $('.period.' + period).addClass('active');
    },

    'mouseup .analog-face, touchend .analog-face, touchcancel .analog-face' : function(event, tmpl) {
        tmpl.locked = true;
    },

    'mousedown .analog-face, touchstart .analog-face' : function(event, tmpl) {
        tmpl.locked = false;
    },

    'mouseup .analog-hours .analog-face, touchend .analog-hours .analog-face, touchcancel .analog-hours .analog-face' : function(event, tmpl) {
        setState('minutes', tmpl);
    },

    'mousedown .analog-face, touchstart .analog-face, mousemove .analog-face, touchmove .analog-face ' : function(event, tmpl) {
        event.preventDefault();
        let clientX;
        let clientY;
        if(tmpl.locked) return;

        if(event.type === 'touchstart' || event.type === 'touchmove'){
            clientX = event.originalEvent.touches[0].clientX;
            clientY = event.originalEvent.touches[0].clientY;
        }
        else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        let radius = tmpl.$('.analog-face').outerWidth() / 2,
            parentOffset = tmpl.$('.analog-face').offset(),
            x = clientX - parentOffset.left - radius,
            y = clientY - parentOffset.top - radius,
            state = tmpl.state.get(),
            number = getNumericValue(state, x, y),
            rotateAngle = getRotateAngle(state, number);
        console.log(clientX, clientY);
        console.log(x,y);
        tmpl.rotateAngle.set(rotateAngle) ;
        number = Math.round(number);

        if (number == 0 && state === 'hours'){
            number = 12;
        }
        else if (number == 60 && state === 'minutes') {
            number = 0;
        }
        let date = tmpl.date.get();

        if (state === 'hours'){
            let period = date.format('a'),
                in24format = format12to24(number, period);
            date.hours(in24format);
            tmpl.date.set(date);
        }
        else if(state === 'minutes'){
            date.minutes(number);
            tmpl.date.set(date);
        }

        highlightAnalogValue(number, state, tmpl);

    }

});

Template.timePicker.helpers({
    date(){
        let date = Template.instance().date.get();
        if(date) {
            return date.format('ddd, MMM DD');
        }
    },

    hours() {
        let date = Template.instance().date.get(),
            hours = date.format('hh');

        return hours;
    },

    minutes() {
        let date = Template.instance().date.get(),
            minutes = date.format('mm');

        return minutes;
    },

    period() {
        return Template.instance().date.get().format('a');
    },

    rotateAngle() {
        return Template.instance().rotateAngle.get();
    },

    hoursState() {
        return Template.instance().state.get() === 'hours';
    },

    minutesState() {
        return Template.instance().state.get() === 'minutes';
    },

    showControls() {
        let options = Template.instance().data.options;
        if(options && !options.showControls){
            return false;
        }
        let onSaved = typeof Template.instance().data.onSaved === 'function';
        return onSaved;
    }

});

function getNumericValue(state, x, y){
    let pieces;
    if (state === 'hours') pieces = 12 / 2;
    else if (state === 'minutes') pieces = 60 / 2;

    let z = Math.sqrt(x * x + y * y),
        theta = Math.asin(y / z),
        closest = (Math.PI / pieces) * Math.round(theta / (Math.PI / pieces));

    closest /= Math.PI;
    closest *= pieces;

    let xPos = x > 0,
        start = pieces / 2;

    if (!xPos) {
        start *= 3;
        closest *= -1;
    }

    let number = start + closest;

    return number;

}

function getRotateAngle(state, number) {
    let pieces;

    if (state === 'hours') pieces = 12 / 2;
    else if (state === 'minutes') pieces = 60 / 2;

    let radians = 0;

    radians += number * Math.PI / pieces;
    radians = (radians > 2 * Math.PI) ? radians - (2 * Math.PI) : radians;

    let angle = radians* (180 / Math.PI);
    return angle;
}

function setState(state, tmpl) {
    tmpl.state.set(state);
    tmpl.locked = false;
    let number,
        date = tmpl.date.get();

    if(state === 'minutes'){
        number = getMinutes(date);

        tmpl.$('.digital-clock .minutes').addClass('active');
        tmpl.$('.digital-clock .hours').removeClass('active');
    } else if(state === 'hours'){
        number = getHours(date);

        tmpl.$('.digital-clock .hours').addClass('active');
        tmpl.$('.digital-clock .minutes').removeClass('active');
    }

    let rotateAngle = getRotateAngle(state, number);
    tmpl.rotateAngle.set(rotateAngle);

    highlightAnalogValue(number, state, tmpl);

}

function highlightAnalogValue(number, state, tmpl) {

    tmpl.$('.analog-hour').removeClass('active');
    tmpl.$('#' + number + state[0]).addClass('active');

}

function format12to24(hours, period) {
    if (period == 'pm' && hours < 12) hours = hours + 12;
    if (period == 'am' && hours == 12) hours = hours - 12;
    return hours;
}

function getPeriod(date){
    return date.get().format('a');
}

function getHours(date){
    return Number(date.get().format('h'));
}

function getMinutes(date){
    return Number(date.get().format('m'))
}
