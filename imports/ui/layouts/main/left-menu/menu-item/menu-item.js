import './menu-item.html';
Template.leftMenuItem.onCreated(function () {
    this.currentPath = new ReactiveVar(Iron.Location.get().path);

    this.autorun(() => {
        let path = Iron.Location.get().path;
        this.currentPath.set(path);
    });
});

Template.leftMenuItem.onRendered(function () {
});

Template.leftMenuItem.helpers({
    isActive() {
        if (Template.instance().data.iconMenu) {
            return Template.instance().data.data.link === Template.instance().currentPath.get();
        }
        else {
            return this.link === Template.instance().currentPath.get();
        }
    },
    iconMenu() {
        return !!Template.instance().data.iconMenu;
    }
});