import './found-entity.html';

Template.foundEntity.onCreated(function () {
});

Template.foundEntity.helpers({
    infoToDisplay() {
        let propertyNameRegExp = /\w+/g;
        let allProperties = [];
        let regExpResArray;
        while ((regExpResArray = propertyNameRegExp.exec(this.displayedPropertyName)) !== null) {
            allProperties.push(regExpResArray[0]);
        }

        let result = this.entity;
        if(this.displayedPropertyName == 'profile.fullName'){
            let userEmail = result && result.emails && result.emails[0] && result.emails[0].address;
            return result.profile.fullName + ' ' + userEmail;
        }
        for (let i = 0; i < allProperties.length; i++) {
            result = result[allProperties[i]];
        }

        return result;
    }
});

Template.foundEntity.events({
    'mousedown .found-entity': function (event, tmpl) {
        event.preventDefault();
        tmpl.data.onSelectEntity(tmpl.data.entity._id);
    }
});
