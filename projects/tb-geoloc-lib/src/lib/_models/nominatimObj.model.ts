export interface NominatimObject {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: number;
  lon: number;
  display_name: string;       // "D 50, Le Boulvé, Cahors, Lot, Occitanie, France métropolitaine, 46800, France",
  address: {
    road: string;             // "D 50",
    city?: string;
    town?: string;
    village?: string;         // "Le Boulvé",
    hamlet?: string;
    county: string;           // "Cahors",
    state: string;            // "Occitanie",
    country: string;          // "France",
    postcode: string;         // "46800",
    country_code: string;     // "fr"
  };
  boundingbox: Array<number>; // ["44.420173", "44.4665552", "1.1474228", "1.1961918"],
  geojson: {
    type: string;             // "LineString",
    coordinates: Array<Array<number>>; // [ [1.1914423, 44.4627485], [1.1960085, 44.4660694], ... ]
  };
  class?: string;             // (reverse) "boundary"
  type?: string;              // (reverse) "administrative",
  score?: number;
}
