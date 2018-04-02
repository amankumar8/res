import { GoogleMaps } from 'meteor/dburles:google-maps';

export class GoogleSearchboxController {
  constructor(_location = {}) {
    this._location = new ReactiveVar(_location);
  }

  get location() {
    return this._location.get();
  }

  set location(value) {
    this._location.set(value);
  }
}
