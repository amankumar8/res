import './screenshot-modal.html';

Template.screenshotModal.onCreated(function () {
    this.screens = new ReactiveVar([]);
    this.selectedScreenshot = new ReactiveVar({});

    this.getNormalScreens = (screens) => {
        _.each(screens, function (screeenTimeLine) {
            screeenTimeLine.screens = _.reject(screeenTimeLine.screens, function (screen) {
                return screen.deleted;
            });
        });
        screens = _.flatten(_.map(screens, function (screeenTimeLine) {
            return screeenTimeLine && screeenTimeLine.screens;
        }));
        return screens;
    };

    this.setPreviousScreenshot = (screens, selectedScreenshot) => {
        let prevIndex = _.indexOf(screens, selectedScreenshot);
        if (prevIndex != -1) {
            let previousScreenshot = screens[prevIndex - 1];
            if (previousScreenshot) {
                prevIndex = prevIndex + 1;
                previousScreenshot.index = prevIndex - 1;
                this.selectedScreenshot.set(previousScreenshot);
            }
        }
    };

    this.setNextScreenshot = (screens, selectedScreenshot) => {
        let nextIndex = _.indexOf(screens, selectedScreenshot);
        if (nextIndex != -1) {
            let nextScreenshot = screens[nextIndex + 1];
            if (nextScreenshot) {
                nextIndex = nextIndex + 1;
                nextScreenshot.index = nextIndex + 1;
                this.selectedScreenshot.set(nextScreenshot);
            }
        }
    };

    this.autorun(() => {
        let data = Template.currentData();
        let screensVar = data && data.screens && data.screens;
        let selectedScreenshot = data && data.screenshot;
        let screens = this.getNormalScreens(screensVar);
        let index = _.indexOf(screens, selectedScreenshot);
        selectedScreenshot.index = index + 1;
        this.screens.set(screens);
        this.selectedScreenshot.set(selectedScreenshot);
    });
});

Template.screenshotModal.onRendered(function () {
    let self = this;

    this.$('.modal').modal();
    this.$('.modal').modal('open');
    this.$('select').material_select();

    this.$('.modal-overlay').on('click', function () {
        self.screens.set([]);
        self.selectedScreenshot.set({});
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        let screens = self.screens.get();
        let selectedScreenshot = self.selectedScreenshot.get();
        if (e.keyCode == 27) {
            self.screens.set([]);
            self.selectedScreenshot.set({});
            removeTemplate(self.view);
        }

        if (e.keyCode == 37) {
            if (screens.length > 0 && _.keys(selectedScreenshot).length > 0) {
                self.setPreviousScreenshot(screens, selectedScreenshot);
            }
        }

        if (e.keyCode == 39) {
            if (screens.length > 0 && _.keys(selectedScreenshot).length > 0) {
                self.setNextScreenshot(screens, selectedScreenshot);
            }
        }

    });
});

Template.screenshotModal.onDestroyed(function () {
    this.$('.modal-overlay').remove();
});

Template.screenshotModal.helpers({
    screenshot() {
        let tmpl = Template.instance();
        return tmpl.selectedScreenshot.get();
    },
    screensLength() {
        let tmpl = Template.instance();
        return tmpl.screens.get().length;
    }
});

Template.screenshotModal.events({
    'click .left-arrow': function (event, tmpl) {
        event.preventDefault();
        let screens = tmpl.screens.get();
        let selectedScreenshot = tmpl.selectedScreenshot.get();
        if (screens.length > 0 && _.keys(selectedScreenshot).length > 0) {
            tmpl.setPreviousScreenshot(screens, selectedScreenshot);
        }
    },
    'click .right-arrow': function (event, tmpl) {
        event.preventDefault();
        let screens = tmpl.screens.get();
        let selectedScreenshot = tmpl.selectedScreenshot.get();
        if (screens.length > 0 && _.keys(selectedScreenshot).length > 0) {
            tmpl.setNextScreenshot(screens, selectedScreenshot);
        }
    }
});

function removeTemplate(view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
}
