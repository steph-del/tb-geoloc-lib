export interface OsmPlaceModel {
  osm_id: string;
  place_id: string;
  osm_type: string;
  lat: string;
  lon: string;
  boundingbox: Array<any>;
  licence: string;
  geojson: JSON;
  address: OsmPlaceAddressModel;
  display_name: string;
}

export interface OsmPlaceAddressModel {
  address29: string;

  // locality fields
  // nominatim provide one or several of those fields (maybe none of them ?)
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;

  country_code: string;
  country: string;
  county: string;
  postcode: string;

  neighbourhood: string;
  pedestrian?: string;
  road: string;
  state: string;
  suburb: string;
}

export interface MapQuestPlaceModel {
  info: any;
  option: any;
  results: Array<{
    street: string;
    adminArea6: string;
    adminArea6Type: string;
    adminArea5: string;
    adminArea5Type: string;
    adminArea4: string;
    adminArea4Type: string;
    adminArea3: string;
    adminArea3Type: string;
    adminArea1: string;
    adminArea1Type: string;
    postalCode: string;
    geocodeQualityCode: string;
    geocodeQuality: string;
    dragPoint: boolean;
    sideOfStreet: string;
    linkId: string;
    unknownInput: string;
    type: string;
    latLng: {lat: number, lng: number};
    displayLatLng: {lat: number, lng: number};
  }>;
}
