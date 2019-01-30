import { Component, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  testLatLngData: any;
  layers = ['osm', 'google hybrid', 'brgm', 'opentopomap'];
  mapQuestApiKey = 'ApIFfQWsb8jW6bkYDD2i0Sq5BD9moJ3l';
  _reset = false;
  patchAddress: string;
  patchElevation: number;
  patchLatLngDec: [number, number];
  drawMarker: [number, number];
  patchGeometry: any;

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

  public reset() {
    this._reset = true;
    setTimeout(() => {
      this._reset = false;
    }, 100);
  }

  public testPatchAddress() {
    this.patchAddress = 'Une super adresse !';
    setTimeout(() => { this.patchAddress = null; }, 100);
  }

  public testPatchElevation() {
    this.patchElevation = 1000;
    setTimeout(() => { this.patchElevation = null; }, 100);
  }

  public testPatchLatLngDec() {
    this.patchLatLngDec = [44, 2];
  }

  public testDrawMarker() {
    this.drawMarker = [44.0, 2.1];
  }

  public testPatchGeometry() {
    this.patchGeometry = [
      {
        type: 'Point',
        coordinates: [44, 1]
      }
    ];
  }

  public testPatchGeometry2() {
    this.patchGeometry = [
      {
        type: 'Point',
        coordinates: [44, 1]
      },
      {
        type: 'Point',
        coordinates: [44.1, 1.1]
      },
      {
        type: 'LineString',
        coordinates: [
          [44, 1], [44.1, 1.1], [44.2, 1]
        ]
      },
      {
        type: 'Polygon',
        coordinates: [
          [44, 0.9], [44, 1], [43.9, 0.9], [43.9, 1]
        ]
      }
    ];
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
