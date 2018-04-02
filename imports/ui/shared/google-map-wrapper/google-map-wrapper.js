import './google-map-wrapper.html';

import { VZ } from '/imports/startup/both/namespace';
import { getCoordinatesFromAddress } from '/imports/api/google-services/google-api/methods';
Template.googleMapWrapper.onCreated(function () {
    let self = this;

    // default coordinates;
    self.coordinates = {lat: 0, lng: 0};

    this.updatePositionAndMarker = function () {
        let coordinates = new google.maps.LatLng(self.coordinates.lat, self.coordinates.lng);
        GoogleMaps.get(self.data.name).instance.setCenter(coordinates);
        if (self.centerMarker) {
            self.centerMarker.setPosition(coordinates);
        }
    };

    // init map
    GoogleMaps.load({
        key: Meteor.settings.public.MAPS_API_KEY,
        libraries: 'places, geometry',
        language: 'en-GB'
    });
    GoogleMaps.ready(self.data.name, function (map) {
        self.centerMarker = new google.maps.Marker({
            position: map.options.center,
            map: map.instance
        });
        self.updatePositionAndMarker();
    });
});

Template.googleMapWrapper.onRendered(function () {
    let self = this;
    // define coordinates from address
    this.autorun(() => {
        let data = Template.currentData();
        if (GoogleMaps.loaded()) {
            // if params give lat and lng already
            if (data && data.options && data.options.coordinates) {
                this.coordinates = data.options.coordinates;
                this.updatePositionAndMarker();
            } else {
                // define lat and lng from address
                if(data && data.options){
                    let params = data.options;
                    getCoordinatesFromAddress.call(params, function (err, res) {
                        if (err) {
                            VZ.notify(err);
                        } else if (res) {
                            self.coordinates = res;
                            self.updatePositionAndMarker();
                        }
                    });
                } 
            }
        }
    });
});

Template.googleMapWrapper.helpers({
    options: function () {
        return {
            zoom: 6,
            styles: [
                {
                    'featureType': 'administrative',
                    'elementType': 'labels.text.fill',
                    'stylers': [
                        {
                            'color': '#444444'
                        }
                    ]
                },
                {
                    'featureType': 'landscape',
                    'elementType': 'all',
                    'stylers': [
                        {
                            'color': '#f2f2f2'
                        }
                    ]
                },
                {
                    'featureType': 'poi',
                    'elementType': 'all',
                    'stylers': [
                        {
                            'visibility': 'off'
                        }
                    ]
                },
                {
                    'featureType': 'road',
                    'elementType': 'all',
                    'stylers': [
                        {
                            'saturation': -100
                        },
                        {
                            'lightness': 45
                        }
                    ]
                },
                {
                    'featureType': 'road.highway',
                    'elementType': 'all',
                    'stylers': [
                        {
                            'visibility': 'simplified'
                        }
                    ]
                },
                {
                    'featureType': 'road.arterial',
                    'elementType': 'labels.icon',
                    'stylers': [
                        {
                            'visibility': 'off'
                        }
                    ]
                },
                {
                    'featureType': 'transit',
                    'elementType': 'all',
                    'stylers': [
                        {
                            'visibility': 'off'
                        }
                    ]
                },
                {
                    'featureType': 'water',
                    'elementType': 'all',
                    'stylers': [
                        {
                            'color': '#46bcec'
                        },
                        {
                            'visibility': 'on'
                        }
                    ]
                }
            ]
        }
    }
});