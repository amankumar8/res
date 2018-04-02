import { Meteor } from 'meteor/meteor';
import {VZ} from '/imports/startup/both/namespace';

export class PlaceParser {
  constructor(_template, _searchBox, _shouldParseCity) {
    this.template = _template;
    this.searchBox = _searchBox;
    this.shouldParseCity = _shouldParseCity === 'shouldParseCity';
    this.places = new ReactiveVar();
  }

  parse(event) {
    this._analysePlaces();
    if(this._isOnePlaceFound()) {
      return this._parsePlace();
    } else {
      return new Promise((resolve, reject) => {
        resolve({ address: '', country: '', city: '' });
      });
    }
  }

  _analysePlaces() {
    const places = this.searchBox.getPlaces();
    if(places.length === 1) {
      this.places.set(places[0]);
    } else if(places.length === 0) {
      VZ.notify('location not found');
    } else if(places.length > 1) {
      VZ.notify('Several locations match, please choose more precise location');
    }
  }

  _isOnePlaceFound() {
    return this.searchBox.getPlaces().length === 1;
  }

  _parsePlace() {
    console.log(this);
    const address = this.places.get().formatted_address;
    if(this._isPlaceParsable()) {
      return new Promise((resolve, reject) => {
        const country = this._parseComponent('country');
        const location = {
          address,
          country
        };
        if(this.shouldParseCity === true) {
          const city = this._parseComponent('locality', 'administrative_area_level_1');
          resolve(Object.assign(location, { city }));
        } else {
          resolve(location);
        }
      });
    } else {
      return this._makeReverseGeocodingAndSetMapOptions();
    }
  }

  _makeReverseGeocodingAndSetMapOptions() {
    return new Promise((resolve, reject) => {
      const data = { place_id: this.places.get().place_id };
      Meteor.call('reverseGeocoding', data, (err, detailedPlace) => {
       if(err) {
         reject(err);
       } else {
         this.places.set(detailedPlace);
         const address = this.places.get().formatted_address;
         const country = this._parseComponent('country');
         const location = {
           address,
           country
         };
         if(this.shouldParseCity === true) {
           const city = this._parseComponent('locality', 'administrative_area_level_1');
           resolve(Object.assign(location, { city }));
         } else {
           resolve(location);
         }
       }
      });
    });
  }

  _parseComponent(type, alternative) {
    let component = this.places.get().address_components.find(component => component.types.indexOf(type) !== -1);
    if(!component) {
      component = this.places.get().address_components.find(component => component.types.indexOf(alternative) !== -1);
    }
    return component && component.long_name;
  }

  _isPlaceParsable() {
    return this.places.get().hasOwnProperty('address_components');
  }
}
