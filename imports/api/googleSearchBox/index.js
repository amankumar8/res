import { Meteor } from 'meteor/meteor';

Meteor.methods({
  reverseGeocoding(data) {
    checkReverseGeocodingData(data);
    const query = buildReverseGeocodingQuery(data);
    const apiKey = Meteor.settings.public.MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${query}&key=${apiKey}`;
    const response =  HTTP.get(url).data;
    if(response.status !== "OK" && response.status !== "ZERO_RESULTS") {
      throw new Meteor.Error('reverse geolocation error',
          `reverse geolocation failed with status ${response.status} ${response.error_message}`
      );
    } else {
      return (response.results.length > 0 && response.results[0]) || [];
    }
  }
});

function checkReverseGeocodingData(data) {
  if(!data) {
    throw new Error('data send to reverse geocoding is not defined');
  } else if(!data.place_id && (!data.lat || !data.lng)) {
    throw new Error('reverse geocoding need place_id or latitude (lat) and longtitude (lng) values');
  }
}

function buildReverseGeocodingQuery(data) {
  if(data.place_id) {
    return `place_id=${data.place_id}`;
  } else if(data.lat && data.lng) {
    return `latlng=${data.lat},${data.lng}`;
  }
}