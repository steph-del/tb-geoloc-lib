/**
 * @todo limit polygon area / polyline lenght
 */
import { Component, OnInit, OnDestroy, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material';
import { Subscription, Observable, zip } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import * as L from 'leaflet';
import 'leaflet-draw';

import { GeoPoint } from '../_helpers/geoConvert';
import * as leafletObjects from '../_helpers/leafletObjects';

import { GeocodingService } from '../_services/geocoding.service';
import { ElevationService } from '../_services/elevation.service';

import { LocationModel } from '../_models/location.model';
import { LatLngDMSAltitudePhotoName } from '../_models/gpsLatLng';

// import { Draw, control, Control, FeatureGroup, Layer, icon, Icon, IconOptions, latLng, LatLng, Map, marker, point, polyline, tileLayer, TileLayer } from 'leaflet';

@Component({
  selector: 'tb-geoloc-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {

  //
  // INPUT / OUTPUT
  //
  @Input() layersToAdd: Array<string> = ['osm'];
  @Input() geolocatedPhotoLatLng: Observable<Array<LatLngDMSAltitudePhotoName>>;

  @Output() location = new EventEmitter<LocationModel>(); // object to return

  //
  // FORMS & related variables
  //
  latlngFormGroup: FormGroup;
  elevationFormGroup: FormGroup;
  geoSearchFormGroup: FormGroup;
  geoSearchResults: Array<any>;
  coordFormat = 'dms';            // 'decimal' | 'dms'

  //
  // Variables
  //
  _location = <LocationModel>{};
  geolocatedPhotoLatLngData: Array<LatLngDMSAltitudePhotoName> = [];
  geolocatedPhotoLatLngDisplayedColumnsTable: Array<string> = ['select', 'photoName', 'lat', 'lng', 'altitude'];
  isLoadingAddress = false;
  isLoadingLatitude = false;
  isLoadingLongitude = false;
  isLoadingElevation = false;

  //
  // SUBSCRIPTIONS
  //
  geoSearchSubscription = new Subscription;

  //
  // LEAFLET VARIABLES AND INITIALIZATION
  //

  // Leaflet variables
  private map: L.Map;
  public mapLat = 0;
  public mapLng = 0;

  // layers
  private osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: 'Open Street map' });
  private googleSatelliteLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Google maps' });
  private googleHybridLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Google maps' });
  private brgmLayer = L.tileLayer.wms('http://geoservices.brgm.fr/geologie', { version: '1.3.0', layers: 'Geologie'});
  private mapLayers = {
    'Google': this.googleHybridLayer,
    'OSM': this.osmLayer,
    'BRGM': this.brgmLayer
  };
  private geoResultsLayer = L.geoJSON(null, {style: function() { return { color: '#ff7800', weight: 5, opacity: 0.65 }; }});
  private geolocatedPhotoLatLngLayer = L.geoJSON();

  // map options
  options = {
    layers: [ this.osmLayer ],
    zoom: 4,
    center: L.latLng({ lat: 46.55886030311719, lng: 2.9882812500000004 })
  };

  // Leaflet map configuration
  drawnItems = new L.FeatureGroup();  // all drawn items
  drawControlFull = leafletObjects.drawControlPanel;      // draw panel
  drawControlEdit = leafletObjects.drawControlEditPanel;  // edit panel
  circleMarkerOpt = leafletObjects.circleMarkerStyle;     // marker options
  geoResultsOpt = leafletObjects.cityStyle;

  //
  // Code
  //

  onMapReady(map: L.Map) {
    this.map = map;
    this.map.addControl(L.control.layers(null, this.mapLayers, { position: 'topright'}));
    this.map.addLayer(this.drawnItems);
    this.map.addLayer(this.geoResultsLayer);
    this.map.addLayer(this.geolocatedPhotoLatLngLayer);
    this.map.addControl(this.drawControlFull);
    this.map.on('draw:created', (e) => {
      const layer = e['layer'];
      const type = e['layerType'];
      // If it's a marker, it must be draggable. By default, leaflet.draw module does not provide a draggable marker
      // So, we don't do a this.drawnItems.addLayer(layer);
      // We just draw a new draggableMarker instead
      if (type === 'marker') {
        const latlng = layer._latlng;
        leafletObjects.draggableMarker(latlng.lat, latlng.lng, () => { this.setInputValues(); }).addTo(this.drawnItems);
      } else {
        this.drawnItems.addLayer(layer);
      }

      // Show / hide control panels
      // if ONE item is drawn, set place and elevation inputs (call API)
      if (this.drawnItems.getLayers().length > 0) {
        this.setMapEditMode();
      }
      if (this.drawnItems.getLayers().length === 1) {
        this.setInputValues();
      }
    });

    this.map.on('draw:deleted', (e) => {
      if (this.drawnItems.getLayers().length === 0) {
        this.setMapDrawMode();
      }
      this.clearGeoResultsLayer();
      this.clearDrawnItemsLayer();
      this.clearForm();
    });

    this.redrawMap(100);
  }


  constructor(
    private fb: FormBuilder,
    private geocodeService: GeocodingService,
    private elevationService: ElevationService) { }

  ngOnInit() {
    // Create forms
    this.latlngFormGroup = this.fb.group({
      latInput: this.fb.control('', [Validators.required, this.latLngDecValidator]),
      lngInput: this.fb.control('', [Validators.required, this.latLngDecValidator]),
      dmsLatInput: this.fb.control('', [Validators.required, this.latLngDmsValidator]),
      dmsLngInput: this.fb.control('', [Validators.required, this.latLngDmsValidator])
    });

    this.elevationFormGroup = this.fb.group({
      elevationInput: this.fb.control('', null)
    });

    this.geoSearchFormGroup = this.fb.group({
      placeInput: this.fb.control('', null)
    });

    // Watch placeInput changes
    this.geoSearchSubscription = this.geoSearchFormGroup.controls.placeInput.valueChanges
    .pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(value => {
        this.isLoadingAddress = true;
        return this.geocodeService.geocode(value);
      })
    ).subscribe(results => {
      this.isLoadingAddress = false;
      this.geoSearchResults = results;
    }, (error) => {
      // @toto manage error
      this.isLoadingAddress = false;
    });

    // Watch geolocated photo input changes
    this.geolocatedPhotoLatLng.subscribe(photoLatLng => {
      this.geolocatedPhotoLatLngData = photoLatLng;

      // Description needed
      this.geolocatedPhotoLatLngData.forEach(data => {
        const _latDms = data.lat.deg + '° ' + data.lat.min + '\'' + data.lat.sec + '"';
        const _lngDms = data.lng.deg + '° ' + data.lng.min + '\'' + data.lng.sec + '"';
        const g = new GeoPoint(_lngDms, _latDms);
        data.latDec = g.latDec;
        data.lngDec = g.lonDec;

        // CREATE GEOJSON
        const latLng = L.latLng(data.latDec, data.lngDec);
        const gpsPhotoMarker = new L.Marker(latLng, { icon: leafletObjects.gpsPhotoMarkerIcon() });
        const html = `
          <b>Fichier "${data.photoName}"</b><br>
          Lat. : ${g.latDeg}<br>
          Lng. : ${g.lonDeg}<br><br>
          Utilisez l'icone <mat-icon matTooltip="Utiliser ces valeurs">where_to_vote</mat-icon> pour selectionner le point à utiliser.`;
        gpsPhotoMarker.bindPopup(html).openPopup();
        gpsPhotoMarker.addTo(this.geolocatedPhotoLatLngLayer);
      });

      // Fit map to geolocated photos markers
      // @Todo
    });
  }

  ngOnDestroy() {
    this.geoSearchSubscription.unsubscribe();
  }

  /**
   * When the map parent's div size change (eg. panel width), have to redraw the map
   * Sometimes (when opening / closing a tab), size change is detected too earlier, need to set a delay (about 10-100ms seems to be convenient)
   * @param delay
   */
  redrawMap(delay?: number) {
    if (delay) {
      window.setTimeout(() => this.map.invalidateSize(), delay);
    } else {
      this.map.invalidateSize();
    }
  }

  /**
   * Show the "edit" toolbar inside map
   */
  setMapEditMode() {
    this.map.removeControl(this.drawControlFull);
    this.map.addControl(leafletObjects.drawControlEditPanel(this.drawnItems));
  }

  /**
   * Show the "draw" toolbar inside map
   */
  setMapDrawMode() {
    this.map.removeControl(leafletObjects.drawControlEditPanel(this.drawnItems));
    this.map.addControl(this.drawControlFull);
  }

  /**
   * Take latitude and longitude input values and call geocoding and elevation API
   * Sometimes you may want to force the elevation value and avoid calling elevation API (eg. elevation come from gps photo metadata)
   * then, you cas use the avoidCallingElevationApi option
   *
   * What is done inside this function :
   * - create an observable that zip all required observables
   * - do a switchmap on the main observable so that if one one the sub-observable change, old data are ignored
   * - when the main observable is finished, can send new location Output
   *
   * Several if / else avoidCallingElevationApi are used because when
   * avoidCallingElevationApi === false, httpTasks returns a single value (osmPlace)
   * whereas if avoidCallingElevationApi === true, httpTasks returns an array of 2 values [elevation, osmPlace]
   */
  setInputValues(avoidCallingElevationApi = false, avoidCallingGeolocApi = false): void {

    this.getLatLngFromDrawnItems();
    this.getLatLngDmsFromDrawnItems();
    let httpTasks: Observable<any>;
    let elevation: any;
    let osmPlace: any;

    if (avoidCallingElevationApi && !avoidCallingGeolocApi) {
      httpTasks = this.reverseGeocodingFromInputValue();
    } else if (avoidCallingGeolocApi && !avoidCallingElevationApi) {
      httpTasks = this.getElevationFromInputValue();
    } else if (!avoidCallingElevationApi && !avoidCallingGeolocApi) {
      httpTasks = zip(
        this.getElevationFromInputValue(),
        this.reverseGeocodingFromInputValue()
      );
    } else if (avoidCallingElevationApi && avoidCallingGeolocApi) {
      // nothing to do ; throw or log an error ?
      return;
    }

    // spinnners on
    this.isLoadingAddress = !avoidCallingGeolocApi;
    this.isLoadingElevation = !avoidCallingElevationApi;

    httpTasks.subscribe(result => {
      this.isLoadingElevation = false;
      this.isLoadingAddress = false;
      if (avoidCallingElevationApi && !avoidCallingGeolocApi) {
        elevation = null;
        osmPlace = result;
      } else if (avoidCallingGeolocApi && !avoidCallingElevationApi) {
        elevation = result;
        osmPlace = null;
        elevation = result;
      } else if (!avoidCallingGeolocApi && !avoidCallingGeolocApi) {
        elevation = result[0];
        osmPlace = result[1];
      }

      // Set elevation input
      if (!avoidCallingElevationApi) { this.elevationFormGroup.controls.elevationInput.setValue(elevation); }

      // bind _location
      if (avoidCallingElevationApi) {
        this.bindLocationOutput([this.elevationFormGroup.controls.elevationInput.value, osmPlace]);
      } else {
        this.bindLocationOutput(result);
      }

      // Patch place input value
      if (!avoidCallingGeolocApi) {
        this.geoSearchFormGroup.controls.placeInput.patchValue(this.geocodeService.getReadbleAddress(osmPlace), {emitEvent: false});
      }

      // emit location
// console.log(this._location);

      // check location integrity
      this.location.next(this._location);

    }, error => {
      // Manage error
      // spinnners off
      this.isLoadingAddress = false;
      this.isLoadingElevation = false;
    });
  }

  /**
   * Should be improved for complex polygons / polylines ?
   * Could use turf.js
   */
  getLatLngFromDrawnItems(): void {
    const centroid = this.drawnItems.getBounds().getCenter();
    this.latlngFormGroup.controls.latInput.setValue(centroid.lat);
    this.latlngFormGroup.controls.lngInput.setValue(centroid.lng);
    // https://github.com/angular/material2/issues/7601#issuecomment-334947280
  }

  /**
   *
   */
  getLatLngDmsFromDrawnItems(): void {
    const centroid = this.drawnItems.getBounds().getCenter();
    const geopoint = new GeoPoint(centroid.lng, centroid.lat);
    this.latlngFormGroup.controls.dmsLatInput.patchValue(geopoint.getLatDeg());
    this.latlngFormGroup.controls.dmsLngInput.patchValue(geopoint.getLonDeg());
  }

  /**
   *
   */
  getElevationFromInputValue(): Observable<number> {
    return this.elevationService.getElevation(this.latlngFormGroup.controls.latInput.value, this.latlngFormGroup.controls.lngInput.value);
  }

  /**
   *
   * @param lat
   * @param long
   */
  reverseGeocodingFromInputValue(): Observable<any> {
    return this.geocodeService.reverse(this.latlngFormGroup.controls.latInput.value, this.latlngFormGroup.controls.lngInput.value);
  }

  /**
   * Check geo coordinates format
   */
  latitudeValidator(control: FormControl) {
    if (control.value === null) { return null; }

    // DMS format
    // latitude overflow ?
    if (control.value.match(`^(\-)?[0-9]{1,2}° [0-9]{1,2}\' [0-9]{1,2}(\.[0-9]{1,2})?\"`)) { return null; }

    // latitude format
    if (control.value.match(`^(\-)?([9][1-9](\.[0-9]*)?)|([9][0].[0-9]*)`)) { return { latitudeValueOverflow: true }; }
    if (control.value.match(`^(\-)?[0-9]{1-2}\.[0-9]*`)) { return null; }

    if (control.touched && control.dirty) { return { wrongFormat: true }; } else { return null; }
  }

  /**
   *
   * @param control
   */
  longitudeValidator(control: FormControl) {
    if (control.value === null) { return null; }

    // DMS format
    // longitude overflow ?
    if (control.value.match(`^(\-)?[0-9]{1,2}° [0-9]{1,2}\' [0-9]{1,2}(\.[0-9]{1,2})?\"`)) { return null; }

    // latitude / longitude format
    if (control.value.match(`^(\-)?(([1][9][1-9](\.?[0-9]*))|([1][9][0]\.[0-9]*)|([0-9]{4,99}(\.[0-9]*)?))`)) { return { longitudeValueOverflow: true }; }
    if (control.value.match(`^(\-)?[0-9][0-9]?[0-9]?(\.)?[0-9]*`)) { return null; }
  }

  /**
   *
   */
  addressSelectedChanged(event: MatAutocompleteSelectedEvent) {
    const osmPlace = event.option.value;
    // Fit map bounds
    const southWest = new L.LatLng(osmPlace.boundingbox[0], osmPlace.boundingbox[2]);
    const northEast = new L.LatLng(osmPlace.boundingbox[1], osmPlace.boundingbox[3]);
    this.map.fitBounds(L.latLngBounds(southWest, northEast));

    // Add geojson to the map
    this.clearGeoResultsLayer();
    this.geoResultsLayer.addData(osmPlace.geojson);

    // Patch input value
    this.geoSearchFormGroup.controls.placeInput.patchValue(this.geocodeService.getReadbleAddress(osmPlace), {emitEvent: false});
    // Fill latitude, longitude & altitude inputs
    const g = new GeoPoint(Number(osmPlace.lon), Number(osmPlace.lat));
    this.latlngFormGroup.controls.latInput.setValue(osmPlace.lat, {emitEvent: false});
    this.latlngFormGroup.controls.lngInput.setValue(osmPlace.lon, {emitEvent: false});
    this.latlngFormGroup.controls.dmsLatInput.setValue(g.getLatDeg() , {emitEvent: false});
    this.latlngFormGroup.controls.dmsLngInput.setValue(g.getLonDeg(), {emitEvent: false});
    this.elevationFormGroup.controls.elevationInput.setValue(osmPlace.elevation, {emitEvent: false});

    // Draw a marker at the center of the polygon
    // + don't call geoLoc API
    this.addMarkerFromLatLngCoord(false, true);

  }

  /**
   *
   */
  addMarkerFromDmsCoord(avoidCallingElevationApi = false, avoidCallingGeolocApi = false) {
    // clear drawn items layer
    this.clearDrawnItemsLayer();

    // update map toolbar
    this.setMapEditMode();
    // @TODO check latitude and longitude values (format + limits)
    const geopoint = new GeoPoint(this.latlngFormGroup.controls.dmsLngInput.value, this.latlngFormGroup.controls.dmsLatInput.value);
    leafletObjects.draggableMarker(geopoint.getLatDec(), geopoint.getLonDec(), (e) => {this.setInputValues(); }).addTo(this.drawnItems);
    this.setInputValues(avoidCallingElevationApi, avoidCallingGeolocApi);
  }

  /**
   *
   */
  addMarkerFromLatLngCoord(avoidCallingElevationApi = false, avoidCallingGeolocApi = false) {
    // clear drawn items layer
    this.clearDrawnItemsLayer();

    // update map toolbar
    this.setMapEditMode();

    // TODO check latitude and longitude values (format + limits)
    const geopoint = new GeoPoint(Number(this.latlngFormGroup.controls.lngInput.value), Number(this.latlngFormGroup.controls.latInput.value));
    leafletObjects.draggableMarker(geopoint.getLatDec(), geopoint.getLonDec(), (e) => {this.setInputValues(); }).addTo(this.drawnItems);
    this.setInputValues(avoidCallingElevationApi, avoidCallingGeolocApi);
  }

  /**
   * Clear the form when nedded : 'draw:deleted', etc.
   */
  clearForm(): void {
    this.latlngFormGroup.controls.latInput.setValue('', {emitEvent: false});
    this.latlngFormGroup.controls.lngInput.setValue('', {emitEvent: false});
    this.latlngFormGroup.controls.dmsLatInput.setValue('', {emitEvent: false});
    this.latlngFormGroup.controls.dmsLngInput.setValue('', {emitEvent: false});
    this.latlngFormGroup.reset();

    this.elevationFormGroup.controls.elevationInput.setValue('', {emitEvent: false});
    this.elevationFormGroup.reset();

    this.geoSearchFormGroup.controls.placeInput.setValue('', {emitEvent: false});
  }

  /**
   * Clear geoResults layer (eg this layer contains administrative polygons -- "commune")
   */
  clearGeoResultsLayer() {
    this.geoResultsLayer.clearLayers();
  }

  /**
   *
   */
  clearDrawnItemsLayer(): void {
    this.drawnItems.clearLayers();
  }

  /**
   *
   */
  resetLocation() {
    this.location = null;
  }

  /**
   * Bind data from elevation and OSM http results to this._location
   * Perform some verifications to ensure data integrity
   * @param data data[0] = elevation, data[1] = osm data   |   data = osm data
   */
  bindLocationOutput(data: Array<any> | any): void {
    // if elevation = 0 or null ?
    // if osm data incomplete ?

    let elevation: any;
    let osmPlace: any;
    if (Array.isArray(data)) {
      elevation = data[0];
      osmPlace = data[1];
    } else {
      elevation = this.elevationFormGroup.controls.elevationInput.value;
      osmPlace = data;
    }

    this._location.elevation = this._location.elevation ? elevation : null;
    this._location.geometry = this._location.geometry ? osmPlace.geojson : null;
    this._location.localityConsistency = this._location.localityConsistency ? true : null;   // perform
    this._location.locationAccuracy = this._location.locationAccuracy ? 0 : null;         // perform
    this._location.osmCountry = this._location.osmCountry ? osmPlace.address.country : null;
    this._location.osmCountryCode = this._location.osmCountryCode ? osmPlace.address.country_code : null;
    this._location.osmCounty = this._location.osmCounty ? osmPlace.address.county : null;
    this._location.osmId = this._location.osmId ? osmPlace.osm_id : null;
    this._location.osmNeighbourhood = this._location.osmNeighbourhood ? null : null;      // not provided by nominatim
    this._location.osmPlaceId = this._location.osmPlaceId ? osmPlace.place_id : null;
    this._location.osmPostcode = this._location.osmPostcode ? osmPlace.address.postcode : null;
    this._location.osmRoad = this._location.osmRoad ? osmPlace.address.road : null;
    this._location.osmState = this._location.osmState ? osmPlace.address.state : null;
    this._location.osmSuburb = this._location.osmSuburb ? osmPlace.address.suburb : null;
    this._location.publishedLocation = this._location.publishedLocation ? null : null;     // perform
    this._location.station = this._location.station ? null : null;               // perform

    // Verifications
  }

  test(format: string): void {
    if (format !== 'decimal' && format !== 'dms') { return; }
    this.coordFormat = format;
  }

  /**
   *
   */
  gpsMarkerSetValues(latDec, lngDec, elevation) {
    // set inputs values
    this.latlngFormGroup.controls.latInput.setValue(latDec);
    this.latlngFormGroup.controls.lngInput.setValue(lngDec);
    this.elevationFormGroup.controls.elevationInput.setValue(elevation);

    // add marker
    this.addMarkerFromLatLngCoord(true);

    // clear geolocated photos layer
    this.geolocatedPhotoLatLngLayer.clearLayers();
  }

  latLngDmsAutoFormatter(value): string {
    return '';
  }

  /**
   * Latitude / longitude DMS format check
   */
  latLngDmsValidator(control: FormControl) {
    const regexp = new RegExp('^(\\-)?[0-9]{1,2}\\° [0-9]{1,2}\\\' [0-9]{1,2}\\.[0-9]{1,12}\\"');
    return regexp.test(control.value) ? null : { malformedLatLngDmsFormat: true };
  }

  /**
   * Latitude / longitude decimal format check
   */
  latLngDecValidator(control: FormControl) {
    const regexp = new RegExp('^(\\-)?[0-9]{1,2}\\.[0-9]{1,20}');
    return regexp.test(control.value) ? null : { malformedLatLngDecFormat: true };
  }
}
