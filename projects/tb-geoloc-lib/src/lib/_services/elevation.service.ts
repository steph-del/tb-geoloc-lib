import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ElevationService {
  mapQuestApiKey: string = null;

  constructor(private http: HttpClient) { }

  public setMapQuestApiKey(apiKey: string): void {
    if (apiKey !== null) { this.mapQuestApiKey = apiKey; }
  }

  getElevation(lat: number, lng: number, provider: string): Observable<number> {
    if (provider === 'openElevation') { return this.getOpenElevation(lat, lng); }
    if (provider === 'mapQuest' && this.mapQuestApiKey !== null) { return this.getMapQuestElevation(lat, lng); }
    return of(-1);
  }

  getOpenElevation(lat: number, lng: number): Observable<number> {
    const apiUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
    return this.http.get(apiUrl).pipe(
      map((obj: OpenElevationApiObject) => obj.results[0].elevation)
    );
  }

  getMapQuestElevation(lat: number, lng: number): Observable<number> {
    const apiUrl = `http://open.mapquestapi.com/elevation/v1/profile?key=${this.mapQuestApiKey}&shapeFormat=raw&latLngCollection=${lat},${lng}`;
    return this.http.get(apiUrl).pipe(
      map((obj: MapQuestElevationApiObject) => obj.elevationProfile[0].height)
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

interface MapQuestElevationApiObject {
  elevationProfile: Array<{
    distance: number,
    height: number
  }>;
  shapePoints: any;
  info: any;
}
