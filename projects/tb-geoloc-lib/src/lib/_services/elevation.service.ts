import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ElevationService {

  constructor(private http: HttpClient) { }

  getElevation(lat: number, lng: number): Observable<number> {
    const apiUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
    return this.http.get(apiUrl).pipe(
      map((obj: OpenElevationApiObject) => obj.results[0].elevation)
    );
  }
}

interface OpenElevationApiObject {
  results: Array<{
    elevation: number,
    latitude: number,
    longitude: number
  }>;
}
