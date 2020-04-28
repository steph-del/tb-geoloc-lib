import { Component, EventEmitter } from '@angular/core';
import { GeocodingService } from 'projects/tb-geoloc-lib/src/lib/_services/geocoding.service';
// import { GeocodingService } from 'tb-geoloc-lib/lib/_services/geocoding.service';

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
  setAddress: string;
  inputFocus = false;
  patchElevation: number;
  patchLngLatDec: [number, number];
  drawMarker: [number, number];
  patchGeometry: any;
  enabled = true;
  osmClassFilter = ['place:*', 'boundary:*', 'highway:*'];

  specificInputCountry = '';
  specificInputCounty = '';
  specificInputCity = '';
  specificInputPlace = '';
  specificLimit = 1;

  constructor(private geocodingService: GeocodingService) { }

  public toggleEnabled() {
    this.enabled = !this.enabled;
    console.log(this.enabled);
  }

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

  public testPatchLngLatDec() {
    this.patchLngLatDec = [1, 44];
  }

  public testDrawMarker() {
    this.drawMarker = [2.1, 44.0];
  }

  public testPatchGeometry() {
    this.patchGeometry = [
      {
        type: 'Point',
        coordinates: [1, 44]
      }
    ];
  }

  public testPatchGeometry2() {
    this.patchGeometry = [
      {
        type: 'MultiPolygon',
        coordinates: [
          [
            [[0.22, 44.26], [0.23, 44.26], [0.23, 44.25], [0.22, 44.25]]
          ],
          [
            [[0.26, 44.27], [0.27, 44.24], [0.24, 44.24]]
          ]
        ]
      }
    ];
  }

  public testPatchGeometry3() {
    this.patchGeometry = [
      {
        type: 'MultiPolygon',
        coordinates: [
          [[[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]],
          [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
           [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
        ]
      }
    ];
  }

  public testPatchGeometry2b() {
    this.patchGeometry = [
      {
        type: 'Point',
        coordinates: [1, 44]
      },
      {
        type: 'Point',
        coordinates: [1.1, 44.1]
      },
      {
        type: 'LineString',
        coordinates: [
          [1, 44], [1.1, 44.1], [1, 44.2]
        ]
      },
      {
        type: 'Polygon',
        coordinates: [
          [0.9, 44], [1, 44], [0.9, 43.9], [1, 43.9]
        ]
      }
    ];
  }

  public testSetAddress() {
    this.setAddress = 'Bélaye France';
  }

  public testSetFocus() {
    this.inputFocus = true;
    setTimeout(() => {
      this.inputFocus = false;
    }, 100);
  }

  public logSpecificSearch() {
    this.geocodingService.geocodeSpecificUsingOSM(this.specificInputCountry,
                                                  this.specificInputCounty,
                                                  this.specificInputCity,
                                                  this.specificInputPlace,
                                                  this.specificLimit).subscribe(
                                                    result => console.log(result),
                                                    error => console.log(error)
                                                  );
      this.geocodingService.geocodeSpecificUsingMapQuest('ApIFfQWsb8jW6bkYDD2i0Sq5BD9moJ3l',
                                                        this.specificInputCountry,
                                                        this.specificInputCounty,
                                                        this.specificInputCity,
                                                        this.specificInputPlace,
                                                        this.specificLimit).subscribe(
                                                        result => console.log(result),
                                                        error => console.log(error)
                                                      );
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
