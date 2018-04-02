import './styleguide.html';

Template.styleguide.onCreated(function(){
    this.date = new ReactiveVar(moment());
});

Template.styleguide.helpers({
    date() {
        return Template.instance().date;
    },

    onSaved() {
        let onSaved = function(date){
            console.log(date);
        };
        return onSaved;
    },

    onCanceled() {
        let onCanceled = function() {
            console.log('Canceled.')
        };
        return onCanceled;
    }
});
