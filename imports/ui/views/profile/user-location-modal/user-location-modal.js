import './user-location-modal.html';

Template.userLocationModal.onCreated(function () {
});

Template.userLocationModal.onRendered(function () {
    let self = this;

    this.$('.modal').modal();
    this.$('.modal').modal('open');

    this.autorun(() => {
        // Template.currentData();
        if (GoogleMaps.loaded()) {
            google.maps.event.trigger(GoogleMaps.maps.profileLocationMap.instance, 'resize')
        }
    });
    this.$('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
});

Template.userLocationModal.onDestroyed(function () {
    this.$('.modal-overlay').remove();
});

Template.userLocationModal.helpers({
    haveLocation() {
        return Template.instance().data.haveLocation;
    },
    mapOptions() {
        let tmpl = Template.instance();
        return {
            coordinates: {
                lat: tmpl.data.coordinates.lat,
                lng: tmpl.data.coordinates.lng
            }
        }
    }
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};