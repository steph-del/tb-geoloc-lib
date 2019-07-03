import { InseeCommune } from './inseeCommune.model';

/**
 * Location model
 * Based on OSM fields
 */

export interface LocationModel {
  geometry: any;
  centroid: any;
  geodatum: string;
  locality: string;
  // inseeCode: string;
  elevation: number;
  publishedLocation: 'précise' | 'localité' | '10x10km';
  locationAccuracy: 'Localité' | 'Lieu-dit' | '0 à 10 m' | '10 à 100 m' | '100 à 500 m';
  station: string;
  sublocality: string;
  localityConsistency: boolean;

  osmState: string;
  osmCountry: string;
  osmCountryCode: string;
  osmCounty: string;
  osmPostcode: number;
  osmRoad?: string;
  osmNeighbourhood?: string;
  osmSuburb?: string;
  osmId: number;
  osmPlaceId: number;

  inseeData: InseeCommune;
}
