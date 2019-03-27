import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { LocationModel } from 'projects/tb-geoloc-lib/src/lib/_models/location.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AppComponent {
  @Input() set layer(value: string) { this.layers_to_add = [value]; }
  @Input() layers_to_add: Array<string> = ['osm'];
  @Input() geolocated_photo_lat_lng: any;
  @Input() set osm_class_filter(value: string) { this._osm_class_filters = [value]; }
  @Input() allow_edit_drawn_items = true;
  @Input() set marker(value: string) { if (value === 'true') { this._marker = true; } }
  @Input() set polyline(value: string) { if (value === 'true') { this._polyline = true; } }
  @Input() set polygon(value: string) { if (value === 'true') { this._polygon = true; } }
  @Input() zoom_init = 4;
  @Input() set lat_init(value: number) { this.lng_lat_init[1] = value; }
  @Input() set lng_init(value: number) { this.lng_lat_init[0] = value; }
  @Input() lng_lat_init: Array<number> = [2.9, 46.5];
  @Input() set get_osm_simple_line(value: string) { if (value === 'true') { this._get_osm_simple_line = true; } }
  @Input() set show_lat_lng_elevation_inputs(value: string) { if (value === 'true') { this._show_lat_lng_elevation_inputs = true; } }
  @Input() lat_lng_format: 'dec' | 'dms' = 'dec';
  @Input() elevation_provider = 'openelevation';
  @Input() geolocation_provider = 'osm';
  @Input() map_quest_api_key: string;

  @Input() set osm_nominatim_api_url(url: string) { if (url && url !== '') { this._osm_nominatim_api_url = url; } }
  @Input() set map_quest_nominatim_api_url(url: string) { if (url && url !== '') { this._map_quest_nominatim_api_url = url; } }
  @Input() set open_elevation_api_url(url: string) { if (url && url !== '') { this._open_elevation_api_url = url; } }
  @Input() set map_quest_elevation_api_url(url: string) { if (url && url !== '') { this._map_quest_elevation_api_url = url; } }
  @Input() set fr_geo_api_url(url: string) { if (url && url !== '') { this._fr_geo_api_url = url; } }

  @Output() location = new EventEmitter<LocationModel>(); // object to return

  _marker: boolean;
  _polyline: boolean;
  _polygon: boolean;
  _get_osm_simple_line: boolean;
  _show_lat_lng_elevation_inputs: boolean;
  _osm_class_filters: Array<string> = [];

  _osm_nominatim_api_url = 'https://nominatim.openstreetmap.org';
  _map_quest_nominatim_api_url = 'https://open.mapquestapi.com/nominatim/v1';
  _open_elevation_api_url = 'https://api.open-elevation.com/api/v1';
  _map_quest_elevation_api_url = 'https://open.mapquestapi.com/elevation/v1';
  _fr_geo_api_url = 'https://geo.api.gouv.fr';

  constructor() { }

  newLocation(data) {
    this.location.emit(data);
  }
}
