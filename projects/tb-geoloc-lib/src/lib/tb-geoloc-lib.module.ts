import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatTooltipModule, MatChipsModule, MatIconModule, MatButtonModule, MatRadioModule, MatProgressBarModule, MatMenuModule, MatTableModule } from '@angular/material';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';

import { TbGeolocLibComponent } from './tb-geoloc-lib.component';
import { MapComponent } from './map/map.component';
import { GeocodingService } from './_services/geocoding.service';
import { ElevationService } from './_services/elevation.service';
import { OsmPlaceReadableAddressPipe } from './_pipes/osm-place-readable-address.pipe';

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    MatSelectModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatTooltipModule, MatChipsModule, MatIconModule, MatButtonModule, MatRadioModule, MatProgressBarModule, MatMenuModule, MatTableModule,
    LeafletModule.forRoot(), LeafletDrawModule.forRoot(),
    FormsModule,
    ReactiveFormsModule],
  declarations: [ TbGeolocLibComponent, MapComponent, OsmPlaceReadableAddressPipe ],
  exports: [ TbGeolocLibComponent, MapComponent ]
})
export class TbGeolocLibModule {
  providers: [
    GeocodingService, ElevationService
  ];
}
