import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, empty } from 'rxjs';
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
    let response: any = {};
    let locality: string = null;

    if (isDefined(osmPlaceResult.address.city)) { locality = osmPlaceResult.address.city;
    } else if (isDefined(osmPlaceResult.address.town)) { locality = osmPlaceResult.address.town;
    } else if (isDefined(osmPlaceResult.address.village)) { locality = osmPlaceResult.address.village;
    } else if (isDefined(osmPlaceResult.address.hamlet)) { locality = osmPlaceResult.address.hamlet; }

    if (isDefined(osmPlaceResult.address.suburb) && isDefined(osmPlaceResult.address.postcode) && locality !== null) {
      response = osmPlaceResult.address.suburb + ', ' + osmPlaceResult.address.postcode + ' ' + locality;
    } else if (!isDefined(osmPlaceResult.address.suburb) && isDefined(osmPlaceResult.address.postcode) && locality !== null) {
      response = osmPlaceResult.address.postcode + ' ' + locality;
    } else {
      response = osmPlaceResult.display_name;
    }

    return response;
  }

}




