import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, empty, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { NominatimObject } from '../_models/nominatimObj.model';
import { OsmPlaceModel } from '../_models/osmPlace.model';
import { isDefined } from '@angular/compiler/src/util';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {

  constructor(private http: HttpClient) { }

  geocode(address: string): Observable<any> {
    if (address === null) { return empty(); } // Avoid sending request on form reset
    const url = `https://nominatim.openstreetmap.org/?format=json&addressdetails=1&q=${address}&format=json&limit=10&polygon_geojson=1`;
    return this.http.get(url).pipe(
      map((obj: NominatimObject) => obj)
    );
  }

  reverse(lat: number, lng: number): Observable<any> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&polygon_geojson=1`;
    return this.http.get(url).pipe(
      map((obj: NominatimObject) => obj)
    );
  }

  getReadbleAddress(osmPlaceResult: OsmPlaceModel): string {
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

    // Return
    if (road && neighbourhood && subLocality && locality) {
      return road + ' (' + neighbourhood + ') ' + subLocality + ' ' + locality;
    } else if (road && !neighbourhood && subLocality && locality) {
      return road + ' ' + subLocality + ' ' + locality;
    } else if (!road && neighbourhood && subLocality && locality) {
      return neighbourhood + ' ' + subLocality + ' ' + locality;
    } else if (!road && !neighbourhood && subLocality && locality) {
      return subLocality + ' ' + locality;
    } else if (!road && !neighbourhood && !subLocality && locality) {
      return locality;
    } else {
      return osmPlaceResult.display_name;
    }

  }

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
        if (filterMatchOccurence > 0 || !removeOccurence) {
          osmFilteredResults.push(osmItem);
        }
      });
      return of(osmFilteredResults);
    } else {
      return of(osmResults);
    }
  }
}




