import './year-picker.html';

Template.yearPicker.onRendered(function(){
});

Template.yearPicker.helpers({
    isActiveYear(year) {
        let selectedYear = Template.instance().data.selectedDateReactiveVar.get().year();
        if(selectedYear == year)
            return 'active';
    }
});

Template.yearPicker.events({
    'click .year-item' : function(event, tmpl) {
        let $element = $(event.target),
            year = Number($element.text()),
            date = tmpl.data.selectedDateReactiveVar.get();
            
        date.year(year);
        //prevent of setting future date
        if(moment().diff(date, 'days', true) < 0 ) date = moment();
        tmpl.data.selectedDateReactiveVar.set(date);
        
        tmpl.$('.year-item').removeClass('active');
        $element.addClass('active');
    }
});