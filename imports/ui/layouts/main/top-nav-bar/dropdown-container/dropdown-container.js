import './dropdown-container.html';

Template.topNavBarDropdownContainer.onCreated(function () {
    let self = this;
    this.closeDropDown = function () {
        Blaze.remove(self.view);
    }
});

Template.topNavBarDropdownContainer.onRendered(function () {
});

Template.topNavBarDropdownContainer.onDestroyed(function () {
});

Template.topNavBarDropdownContainer.helpers({
    contentTmplData() {
        let tmpl = Template.instance();
        return {
            closeDropDown: tmpl.closeDropDown
        };
    }
});

Template.topNavBarDropdownContainer.events({
    'click .dropdown-overlay': function (event, tmpl) {
        tmpl.closeDropDown();
    }
});