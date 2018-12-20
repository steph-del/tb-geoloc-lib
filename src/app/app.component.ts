import { Component, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  testLatLngData: any;
  layers = ['osm', 'google hybrid', 'brgm', 'opentopomap'];

  public locationChange(data) {
    console.log(data);
  }

  public emitLatLngData() {
    const data = [
      {
        lat: {deg: 44, min: 27, sec: 8.976},
        lng: {deg: 1, min: 9, sec: 24.84},
        altitude: 187.6,
        photoName: 'PA050156.JPG'
      },
      {
        lat: {deg: 46, min: 27, sec: 5.432},
        lng: {deg: 3, min: 12, sec: 24.84},
        altitude: 187.6,
        photoName: 'PA050234.JPG'
      },
      {
        lat: {deg: 48, min: 25, sec: 8.765},
        lng: {deg: 6, min: 15, sec: 24.84},
        altitude: 187.6,
        photoName: 'PA050789.JPG'
      }
    ];

    console.log('app emit gps data...');
    this.testLatLngData = data;
    // this.testLatLngData.next(data);
  }
}

export interface LatLngDMSAltitudePhotoName {
  lat: DMS;
  lng: DMS;
  altitude: number;
  photoName: string;
}
export interface DMS {
  deg: number;
  min: number;
  sec: number;
}
