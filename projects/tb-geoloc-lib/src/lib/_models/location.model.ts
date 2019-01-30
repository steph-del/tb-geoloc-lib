import { InseeCommune } from './inseeCommune.model';

/**
 * Location model
 * Based on OSM fields
 */

export interface LocationModel {
  geometry: any;
  geodatum: string;
  locality: string;
  // inseeCode: string;
  elevation: number;
  publishedLocation: 'précise' | 'localité' | '10x10km';
  locationAccuracy: number;
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
