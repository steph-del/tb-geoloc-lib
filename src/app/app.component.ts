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
  @Input() osm_class_filter: Array<string> = [];
  @Input() allow_edit_drawn_items = true;
  @Input() set marker(value: string) { if (value === 'true') { this._marker = true; } }
  @Input() set polyline(value: string) { if (value === 'true') { this._polyline = true; } }
  @Input() set polygon(value: string) { if (value === 'true') { this._polygon = true; } }
  @Input() zoom_init = 4;
  @Input() set lat_init(value: number) { this.lat_lng_init[0] = value; }
  @Input() set lng_init(value: number) { this.lat_lng_init[1] = value; }
  @Input() lat_lng_init: Array<number> = [46.5, 2.9];
  @Input() set get_osm_simple_line(value: string) { if (value === 'true') { this._get_osm_simple_line = true; } }
  @Input() set show_lat_lng_elevation_inputs(value: string) { if (value === 'true') { this._show_lat_lng_elevation_inputs = true; } }
  @Input() map_quest_api_key = 'mG6oU5clZHRHrOSnAV0QboFI7ahnGg34';


  @Output() location = new EventEmitter<LocationModel>(); // object to return

  _marker: boolean;
  _polyline: boolean;
  _polygon: boolean;
  _get_osm_simple_line: boolean;
  _show_lat_lng_elevation_inputs: boolean;

  constructor() { }

  newLocation(data) {
    this.location.emit(data);
  }
}
