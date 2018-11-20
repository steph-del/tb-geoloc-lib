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
