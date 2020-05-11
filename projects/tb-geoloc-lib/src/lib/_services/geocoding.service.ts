import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, empty, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { NominatimObject } from '../_models/nominatimObj.model';
import { OsmPlaceModel, MapQuestPlaceModel } from '../_models/osmPlace.model';
import { InseeCommune } from '../_models/inseeCommune.model';
import { isDefined } from '@angular/compiler/src/util';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  mapQuestApiKey = new BehaviorSubject<string>('');
  osmNominatimApiUrl = 'https://nominatim.openstreetmap.org';
  mapQuestNominatimApiUrl = 'https://open.mapquestapi.com/nominatim/v1/search.php';
  frGeoApiUrl: string = null;

  constructor(private http: HttpClient) { }

  public setMapQuestApiKey(apiKey: string): void {
    if (apiKey !== null) { this.mapQuestApiKey.next(apiKey); }
  }

  /**
   * Geocode an address
   * @param address a simple string representing the address
   * @param provider 'osm' | 'mapquest'
   */
  geocode(address: string, provider: string): Observable<Array<NominatimObject>> {
    if (address === null) { return empty(); } // Avoid sending request on form reset
    if (provider.toLowerCase() === 'osm') { return this.geocodeUsingOSM(address); }
    if (provider.toLowerCase() === 'mapquest') { return this.geocodeUsingMapQuest(address); }
  }

  /**
   * Geocode a specific address
   * only with OSM provider for now
   */
  /*geocodeSpecific(provider = 'osm', country: string | undefined, county: string | undefined, city: string | undefined, place: string | undefined, limit: number | undefined): Observable<Array<NominatimObject>> {
    if (provider.toLowerCase() === 'osm') { return this.geocodeSpecificUsingOSM(country, county, city, place, limit); }
    if (provider.toLowerCase() === 'mapquest') { return this.geocodeSpecificUsingMapQuest(country, county, city, place, limit); }
  }*/

  public geocodeSpecificUsingOSM(country: string | undefined, county: string | undefined, city: string | undefined, place: string | undefined, limit: number | undefined): Observable<Array<NominatimObject>> {
    const parameters = `?format=json&addressdetails=1&format=json&polygon_geojson=1${limit ? '&limit=' + limit : ''}`;

    if (!city && !county && !country && !place) { return of([]); }

    let query =  parameters;
    if (city) { query += `&city=${city}`; }
    if (county) { query += `&county=${county}`; }
    if (country) { query += `&country=${country}`; }
    if (place) { query += `&place=${place}`; }
    const apiUrl = `${this.osmNominatimApiUrl}/${query}`;
    return this.http.get<Array<NominatimObject>>(apiUrl);
  }

  public geocodeSpecificUsingMapQuest(mapquestKey: string, country: string | undefined, county: string | undefined, city: string | undefined, place: string | undefined, limit: number | undefined): Observable<Array<NominatimObject>> {
    const parameters = `?key=${mapquestKey}&format=json&addressdetails=1&format=json&polygon_geojson=1${limit ? '&limit=' + limit : ''}`;
    if (!city && !county && !country && !place) { return of([]); }

    let query =  parameters;
    if (city) { query += `&city=${city}`; }
    if (county) { query += `&county=${county}`; }
    if (country) { query += `&country=${country}`; }
    if (place) { query += `&place=${place}`; }
    const apiUrl = `${this.mapQuestNominatimApiUrl}/${query}`;
    return this.http.get<Array<NominatimObject>>(apiUrl);
  }

  reverse(lat: number, lng: number, provider: string): Observable<any> {
    if (provider.toLowerCase() === 'osm') { return this.reverseUsingOSM(lat, lng); }
    if (provider.toLowerCase() === 'mapquest') { return this.reverseUsingMapQuest(lat, lng); }
  }

  /**
   * Get an human readable address
   * @param results OsmPlaceModel | MapQuestPlaceModel
   */
  getReadbleAddress(results: any, provider: string): string {
    if (provider.toLowerCase() === 'osm') { return this.getNominatimReadbleAddress(results); }
    if (provider.toLowerCase() === 'mapquest') {
      if (isDefined(results.results)) {
        return this.getMapQuestReadableAddress(results);    // MapQuest geocoding returns an OsmPlaceModel object
      } else if (isDefined(results.address)) {
        return this.getNominatimReadbleAddress(results);    // MapQuest reverse geocoding returns a MapQuestPlaceModel object
      }
    }
  }

  geocodeUsingOSM(address: string): Observable<Array<NominatimObject>> {
    const apiUrl = `${this.osmNominatimApiUrl}/?format=json&addressdetails=1&q=${address}&format=json&limit=10&polygon_geojson=1`;
    return this.http.get<Array<NominatimObject>>(apiUrl);
  }

  geocodeUsingMapQuest(address: string, mapQuestKey?: string | undefined): Observable<Array<NominatimObject>> {
    const apiUrl = `${this.mapQuestNominatimApiUrl}/search.php?key=${this.mapQuestApiKey.getValue()}&addressdetails=1&q=${address}&format=json&limit=10&polygon_geojson=1`;
    return this.http.get<Array<NominatimObject>>(apiUrl);
  }

  reverseUsingOSM(lat: number, lng: number): Observable<NominatimObject> {
    const apiUrl = `${this.osmNominatimApiUrl}/reverse?format=json&lat=${lat}&lon=${lng}&polygon_geojson=1`;
    return this.http.get<NominatimObject>(apiUrl);
  }

  reverseUsingMapQuest(lat: number, lng: number): Observable<NominatimObject> {
    const apiUrl = `${this.mapQuestNominatimApiUrl}/reverse?key=${this.mapQuestApiKey.getValue()}&lat=${lat}&lon=${lng}`;
    return this.http.get<NominatimObject>(apiUrl);
  }

  /**
   * Nominatim returns a lot of data... not always the same data
   * We only want structured data to be shown to the user : a readbale address here
   */
  getNominatimReadbleAddress(osmPlaceResult: OsmPlaceModel): string {
    let locality: string = null;    // city or village or ...
    let subLocality: string = null; // district or
    let road: string = null;
    let neighbourhood: string = null;

    // Get "city" information (I mean city or something similar like village)
    if (isDefined(osmPlaceResult.address.city)) { locality = osmPlaceResult.address.city;
    } else if (isDefined(osmPlaceResult.address.town)) { locality = osmPlaceResult.address.town;
    } else if (isDefined(osmPlaceResult.address.village)) { locality = osmPlaceResult.address.village;
    } else if (isDefined(osmPlaceResult.address.hamlet)) { locality = osmPlaceResult.address.hamlet; }

    // Get suburbr & if not defined : postcode
    if (isDefined(osmPlaceResult.address.suburb) && isDefined(osmPlaceResult.address.postcode) && locality !== null) {
      subLocality = osmPlaceResult.address.suburb + ', ' + osmPlaceResult.address.postcode;
    } else if (!isDefined(osmPlaceResult.address.suburb) && isDefined(osmPlaceResult.address.postcode) && locality !== null) {
      subLocality = osmPlaceResult.address.postcode;
    }

    // Get "road"
    if (isDefined(osmPlaceResult.address.road)) {
      road = osmPlaceResult.address.road;
    } else if (isDefined(osmPlaceResult.address.pedestrian)) {
      road = osmPlaceResult.address.pedestrian;
    }

    // Get neighbourhood
    if (isDefined(osmPlaceResult.address.neighbourhood)) {
      neighbourhood = osmPlaceResult.address.neighbourhood;
    }

    // Get country
    const country = osmPlaceResult.address.country;
    const showCountry = country !== 'France' ? ' (' + country + ')' : '';

    // Return
    if (road && neighbourhood && subLocality && locality) {
      return road + ' (' + neighbourhood + ') ' + subLocality + ' ' + locality + showCountry;
    } else if (road && !neighbourhood && subLocality && locality) {
      return road + ' ' + subLocality + ' ' + locality + showCountry;
    } else if (road && !neighbourhood && !subLocality && locality) {
      return road + ', ' + locality + showCountry;
    } else if (!road && neighbourhood && subLocality && locality) {
      return neighbourhood + ' ' + subLocality + ' ' + locality;
    } else if (!road && !neighbourhood && subLocality && locality) {
      return subLocality + ' ' + locality + showCountry;
    } else if (!road && !neighbourhood && !subLocality && locality) {
      return locality + showCountry;
    } else {
      return osmPlaceResult.display_name + showCountry;
    }

  }

  /**
   * Create a readable address from mapQuest result
   * see https://developer.mapquest.com/documentation/open/geocoding-api/reverse/get/
   */
  getMapQuestReadableAddress(mapQuestResult: any): string {
    const MQR = mapQuestResult.results[0].locations[0];

    let locality: string = null;    // city or village or ...
    let subLocality: string = null; // district or
    let road: string = null;
    let neighbourhood: string = null;

    locality = MQR.adminArea5;
    subLocality = MQR.adminArea4;
    road = MQR.street;
    neighbourhood = MQR.adminArea6;

    // Return
    if (road && neighbourhood && subLocality && locality) {
      return road + ' (' + neighbourhood + ') ' + subLocality + ' ' + locality;
    } else if (road && !neighbourhood && subLocality && locality) {
      return road + ' ' + subLocality + ' ' + locality;
    } else if (road && !neighbourhood && !subLocality && locality) {
      return road + ', ' + locality;
    } else if (!road && neighbourhood && subLocality && locality) {
      return neighbourhood + ' ' + subLocality + ' ' + locality;
    } else if (!road && !neighbourhood && subLocality && locality) {
      return subLocality + ' ' + locality;
    } else if (!road && !neighbourhood && !subLocality && locality) {
      return locality;
    }
  }

  /**
   * Filter the Nominatim results by its key:value tags
   * OSM tags : https://github.com/openstreetmap/Nominatim/blob/80df4d3b560f5b1fd550dcf8cdc09a992b69fee0/settings/partitionedtags.def
   */
  osmClassFilter(osmClassFilter: Array<string>, osmResults: Array<NominatimObject>) {
    const osmFilteredResults: Array<NominatimObject> = [];
    if (osmClassFilter.length > 0 && osmResults.length > 0) {
      osmResults.forEach(osmItem => {
        let filterMatchOccurence = 0;
        let removeOccurence   = false;
        osmClassFilter.forEach(osmFilterItem => {
          const _class = osmFilterItem.split(':')[0];
          const _type = osmFilterItem.split(':')[1];
          if (_type === '*') {
            if (osmItem.class === _class) { filterMatchOccurence++; }
          } else {
            // if !, remove
            if (_type.substr(0, 1) === '!') {
              if (osmItem.class === _class && '!' + osmItem.type === _type) { removeOccurence = true; }
            } else {
              if (osmItem.class === _class && osmItem.type === _type) { filterMatchOccurence++; }
            }
          }
        });
        if (filterMatchOccurence > 0 && !removeOccurence) {
          osmFilteredResults.push(osmItem);
        }
      });
      return of(osmFilteredResults);
    } else {
      return of(osmResults);
    }
  }

  /**
   * Sometime, we have to reverse latitude and longitude according to Leaflet specifications
   */
  reverseCorrdinatesArray(coordinatesArray: Array<[number, number]>) {
    if (coordinatesArray.length > 0) {
      coordinatesArray.forEach(item => {
        item.reverse();
      });
      return coordinatesArray;
    }
  }

  /**
   * Returns a simple line (2 points) from a polyline
   */
  simplifyPolyline(coordinatesArray: Array<[number, number]>): Array<[number, number]> {
    if (coordinatesArray.length > 1) {
      const firstCoordinate = coordinatesArray[0];
      const lastCoordinate = coordinatesArray[coordinatesArray.length - 1];
      return [firstCoordinate, lastCoordinate];
    } else {
      return coordinatesArray;
    }
  }

  /**
   * Get INSEE data (France only)
   */
  getInseeData(lat: number, lng: number): Observable<any> {
    const apiUrl = `${this.frGeoApiUrl}/communes?lat=${lat}&lon=${lng}`;
    return this.http.get(apiUrl).pipe(
      map((obj) => obj[0] as InseeCommune)
    );
  }

  setOsmNominatimApiUrl(url: string): void {
    this.osmNominatimApiUrl = url;
  }
  setMapQuestNominatimApiUrl(url: string): void {
    this.mapQuestNominatimApiUrl = url;
  }
  setFrGeoApiUrl(url: string): void {
    this.frGeoApiUrl = url;
  }
}
