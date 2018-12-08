import { Component, OnInit, OnDestroy, EventEmitter, Input, Output, NgZone } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material';
import { Subscription, Observable, zip } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { isDefined } from '@angular/compiler/src/util';
import * as L from 'leaflet';
import 'leaflet-draw';
import { LatLngExpression } from 'leaflet';

import { GeoPoint } from '../_helpers/geoConvert';
import * as leafletObjects from '../_helpers/leafletObjects';
import { dmsFormatter } from '../_helpers/dmsTools';

import { GeocodingService } from '../_services/geocoding.service';
import { ElevationService } from '../_services/elevation.service';

import { LocationModel } from '../_models/location.model';
import { NominatimObject } from '../_models/nominatimObj.model';
import { LatLngDMSAltitudePhotoName } from '../_models/gpsLatLng';

@Component({
  selector: 'tb-geoloc-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {

  // --------------
  // INPUT / OUTPUT
  // --------------
  @Input() layersToAdd: Array<string> = ['osm'];
  @Input() set geolocatedPhotoLatLng(value: Array<LatLngDMSAltitudePhotoName>) {
    this._geolocatedPhotoLatLng.emit(value);
  }
  @Input() osmClassFilter: Array<string> = [];
  @Input() allowEditDrawnItems = false;
  @Input() marker = true;
  @Input() polyline = true;
  @Input() polygon = true;
  @Input() latLngInit = [46.55886030, 2.98828125];
  @Input() zoomInit = 4;
  @Input() getOsmSimpleLine = false;
  @Input() showLatLngElevationInputs = true;

  @Output() location = new EventEmitter<LocationModel>(); // object to return

  // -------------------------
  // FORMS & RELATED VARIABLES
  // -------------------------
  latlngFormGroup: FormGroup;
  elevationFormGroup: FormGroup;
  geoSearchFormGroup: FormGroup;
  geoSearchResults: Array<NominatimObject>;
  coordFormat = 'dms';            // 'decimal' | 'dms'

  // ---------
  // VARIABLES
  // ---------
  _location = <LocationModel>{};
  osmPlace: any = null;
  _geolocatedPhotoLatLng: EventEmitter<Array<LatLngDMSAltitudePhotoName>> = new EventEmitter();
  geolocatedPhotoLatLngData: Array<LatLngDMSAltitudePhotoName> = [];
  geolocatedPhotoLatLngDisplayedColumnsTable: Array<string> = ['select', 'fileName', 'lat', 'lng', 'altitude'];
  isLoadingAddress = false;
  isLoadingLatitude = false;
  isLoadingLongitude = false;
  isLoadingElevation = false;

  // -------------
  // SUBSCRIPTIONS
  // -------------
  geoSearchSubscription = new Subscription;
  latDmsInputSubscription = new Subscription;
  lngDmsInputSubscription = new Subscription;
  elevationInputSubscription = new Subscription;

  // ----------------------------------------
  // LEAFLET VARIABLES, LAYERS AND MAP CONFIG
  // ----------------------------------------
  private map: L.Map;
  public mapOptions: any;
  public mapLat = 0;
  public mapLng = 0;
  private drawType: string;
  private drawnItem: any;

  private osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: 'Open Street map' });
  private openTopoMapLayer = L.tileLayer('https://a.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: 'OpenTopoMap'});
  private googleHybridLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Google maps' });
  private brgmLayer = L.tileLayer.wms('http://geoservices.brgm.fr/geologie', { version: '1.3.0', layers: 'Geologie'});
  private mapLayers: L.Control.LayersObject = {}; // set inside onInit() function
  private geoResultsLayer = L.geoJSON(null, {style: function() { return { color: '#ff7800', weight: 5, opacity: 0.65 }; }});
  private geolocatedPhotoLatLngLayer = L.geoJSON();

  // Leaflet map configuration
  drawnItems: L.FeatureGroup = new L.FeatureGroup();  // all drawn items
  circleMarkerOpt: any = leafletObjects.circleMarkerStyle;     // marker options
  geoResultsOpt: any = leafletObjects.cityStyle;
  // controls below are set inside onInit() function
  drawControlFull: L.Control.Draw;  // draw panel
  drawControlEdit: L.Control.Draw;  // edit panel

  // ----
  // CODE
  // ----

  constructor(
    private fb: FormBuilder,
    private geocodeService: GeocodingService,
    private elevationService: ElevationService,
    private zone: NgZone) { }

  /**
   * - Create the forms
   * - Set up subscriptions (geo search, geolocated photos, lat / lng inputs)
   */
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
      // filter results if needed
      if (this.osmClassFilter.length > 0) {
        this.geocodeService.osmClassFilter(this.osmClassFilter, results).subscribe(filteredResults => {
          this.geoSearchResults = filteredResults;
        });
      } else {
        this.geoSearchResults = results;
      }
    }, (error) => {
      // @toto manage error
      this.isLoadingAddress = false;
    });

    // Watch geolocated photo input changes
    this._geolocatedPhotoLatLng.subscribe(photoLatLng => {
      // @todo clear this.geolocatedPhotoLatLngLayer

      this.geolocatedPhotoLatLngData = photoLatLng;

      // For each geolocated photo, add marker and bind mouse event on thoses markers
      this.geolocatedPhotoLatLngData.forEach(data => {
        // Get latitude and longitude (geolocated data are in DMS format)
        const _latDms = data.lat.deg + '° ' + data.lat.min + '\'' + data.lat.sec + '"';
        const _lngDms = data.lng.deg + '° ' + data.lng.min + '\'' + data.lng.sec + '"';
        const g = new GeoPoint(_lngDms, _latDms);
        data.latDec = g.latDec;
        data.lngDec = g.lonDec;

        // Create the marker
        const latLng = L.latLng(data.latDec, data.lngDec);
        const gpsPhotoMarker = new L.Marker(latLng, { icon: leafletObjects.gpsPhotoMarkerIcon() });
        // Marker popup
        const html = `
          <b>Fichier "${data.fileName}"</b><br>
          Lat. : ${g.latDeg}<br />
          Lng. : ${g.lonDeg}<br />
          Alt. : ${data.altitude} m<br /><br />
          <b>Cliquez sur le point pour utiliser ces coordonnées</b>`;
        gpsPhotoMarker.bindPopup(html).openPopup();
        // Marker mouse events
        gpsPhotoMarker.on('click', (event => { this.gpsMarkerSetValues(data.latDec, data.lngDec, data.altitude); }));
        gpsPhotoMarker.on('mouseover', (event) => { gpsPhotoMarker.openPopup(); });
        gpsPhotoMarker.on('mouseout', (event => { gpsPhotoMarker.closePopup(); }));
        // Add the marker to the map
        gpsPhotoMarker.addTo(this.geolocatedPhotoLatLngLayer);
      });

      // Fit map to geolocated photos markers
      this.flyToGeolocatedPhotoItems();
    });

    // Watch elevation input change
    this.elevationInputSubscription = this.elevationFormGroup.controls.elevationInput.valueChanges
    .pipe(
      debounceTime(500)
    ).subscribe(result => {
      if (this.osmPlace !== null) {
        const elevation = result;
      this.bindLocationOutput([elevation, this.osmPlace]);
      }
    });

    // Map options
    this.mapOptions = {
      layers: [],
      zoom: this.zoomInit,
      center: L.latLng({ lat: this.latLngInit[0], lng: this.latLngInit[1] })
    };

    // this.allowEditDrawnItems, this.marker, this.polyline & this.polygon are not set until onInit is call
    // for other draw controls, see code above
    this.drawControlEdit = leafletObjects.drawControlEditPanel(this.drawnItems, this.allowEditDrawnItems);
    this.drawControlFull = leafletObjects.drawControlPanel(this.marker, this.polyline, this.polygon);      // draw panel

    // Add map layers
    if (this.layersToAdd.indexOf('osm') !== -1) { this.mapLayers['OSM'] = this.osmLayer; }
    if (this.layersToAdd.indexOf('opentopomap') !== -1) { this.mapLayers['OSM'] = this.osmLayer; }
    if (this.layersToAdd.indexOf('google hybrid') !== -1) { this.mapLayers['Google hybride'] = this.googleHybridLayer; }
    if (this.layersToAdd.indexOf('brgm') !== -1) { this.mapLayers['BRGM'] = this.brgmLayer; }

    // First layer added is shown
    switch (this.layersToAdd[0]) {
      case 'osm':
        this.mapOptions.layers.push(this.osmLayer);
        break;
        case 'opentopomap':
        this.mapOptions.layers.push(this.openTopoMapLayer);
        break;
      case 'google hybrid':
        this.mapOptions.layers.push(this.googleHybridLayer);
        break;
      case 'brgm':
        this.mapOptions.layers.push(this.brgmLayer);
        break;
    }

    // Watch lat & lng DMS inputs changes and set up the DMS formatter
    // The DMS formatter restricts the keyboard input of the user : only number, comma, dot and '-', deg and min must be between -90 and +90
    // The formatter auto fill the ° ' and " characters to help the user input
    this.latDmsInputSubscription = this.latlngFormGroup.controls.dmsLatInput.valueChanges.subscribe(value => {
      this.latlngFormGroup.controls.dmsLatInput.setValue(dmsFormatter(value), { emitEvent: false});
    });
    this.lngDmsInputSubscription = this.latlngFormGroup.controls.dmsLngInput.valueChanges.subscribe(value => {
      this.latlngFormGroup.controls.dmsLngInput.setValue(dmsFormatter(value), { emitEvent: false});
    });
  }

  /**
   * Unsubscribe
   */
  ngOnDestroy() {
    this.geoSearchSubscription.unsubscribe();
    this.latDmsInputSubscription.unsubscribe();
    this.lngDmsInputSubscription.unsubscribe();
    this.elevationInputSubscription.unsubscribe();
    this._geolocatedPhotoLatLng.unsubscribe();
  }

  /**
   * Add layers and events listeners
   * Several leaflet event callback handler happens outside of the Angular zone
   * see https://github.com/Asymmetrik/ngx-leaflet#a-note-about-change-detection
   * For these events, if needed (especially for input updates, spinners, etc.), we run it into the Angular zone
   */
  onMapReady(map: L.Map) {
    this.map = map;
    this.map.addControl(L.control.layers(null, this.mapLayers, { position: 'topright'}));
    this.map.addLayer(this.drawnItems);
    this.map.addLayer(this.geoResultsLayer);
    this.map.addLayer(this.geolocatedPhotoLatLngLayer);
    this.map.addControl(this.drawControlFull);
    this.map.on('draw:created', (e) => {
      this.drawnItem = e['layer'];
      this.drawType = e['layerType'];
      // If it's a marker, it must be draggable. By default, leaflet.draw module does not provide a draggable marker
      // So, we don't do a this.drawnItems.addLayer(layer);
      // We just draw a new draggableMarker instead
      if (this.drawType === 'marker') {
        const latlng = this.drawnItem._latlng;
        leafletObjects.draggableMarker(latlng.lat, latlng.lng, (dragEnd) => {
          this.zone.run(() => {
            this.callGeolocElevationApisUsingLatLngInputsValues();
          });
        }).addTo(this.drawnItems);
      } else {
        this.drawnItems.addLayer(this.drawnItem);
      }

      // Show / hide control panels
      // if ONE item is drawn, set place and elevation inputs (call API)
      if (this.drawnItems.getLayers().length > 0) {
        this.setMapEditMode();
      }
      if (this.drawnItems.getLayers().length === 1) {
        this.zone.run(() => {
          this.callGeolocElevationApisUsingLatLngInputsValues();
        });
      }

      this.flyToDrawnItems();
    });

    this.map.on('draw:edited', (e) => {
      this.drawnItem = e['layer'];
      this.drawType = e['layerType'];

//      this.drawnItems.addLayer(this.drawnItem);

      if (this.drawnItems.getLayers().length === 1) {
        this.zone.run(() => {
          this.callGeolocElevationApisUsingLatLngInputsValues();
        });
      }

      this.flyToDrawnItems();
    });

    this.map.on('draw:deleted', (e) => {
      this.clearGeoResultsLayer();
      this.clearDrawnItemsLayer();
      this.setMapDrawMode();
      this.zone.run(() => {
        this.clearForm();
      });
    });

    this.redrawMap(100);
  }

  /**
   * When the map parent's div size change (eg. panel width), have to redraw the map
   * Sometimes (when opening / closing a tab), size change is detected too earlier, need to set a delay (about 10-100ms seems to be convenient)
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
    this.map.addControl(this.drawControlEdit);
  }

  /**
   * Show the "draw" toolbar inside map
   */
  setMapDrawMode() {
    this.map.removeControl(this.drawControlEdit);
    this.map.addControl(this.drawControlFull);
  }

  /**
   * Set map bounds to drawn items
   */
  flyToDrawnItems(_maxZoom = 14) {
    const b = this.drawnItems.getBounds();
    this.map.flyToBounds(b, { maxZoom: _maxZoom, animate: false });
  }

  /**
   * Set map bounds to geo reults items
   */
  flyToGeoResultsItems() {
    const b = this.geoResultsLayer.getBounds();
    this.map.flyToBounds(b, { maxZoom: 14, animate: false });
  }

  /**
   * Set map bounds to geolocated photos items
   */
  flyToGeolocatedPhotoItems() {
    const b = this.geolocatedPhotoLatLngLayer.getBounds();
    this.map.flyToBounds(b, { maxZoom: 14, animate: false });
  }

  /**
   * Draw a marker on drawItems featureGroup with DMS input values
   */
  addMarkerFromDmsCoord() {
    // clear drawn items layer
    this.clearDrawnItemsLayer();

    // update map toolbar
    this.setMapEditMode();
    // @TODO check latitude and longitude values (format + limits)
    const geopoint = new GeoPoint(this.latlngFormGroup.controls.dmsLngInput.value, this.latlngFormGroup.controls.dmsLatInput.value);
    leafletObjects.draggableMarker(geopoint.getLatDec(), geopoint.getLonDec(), (e) => { /* dragend callback fn */ this.callGeolocElevationApisUsingLatLngInputsValues(); }).addTo(this.drawnItems);

    // Set (decimal) latLng inputs
    this.latlngFormGroup.controls.latInput.setValue(geopoint.getLatDec(), { emitEvent: false });
    this.latlngFormGroup.controls.lngInput.setValue(geopoint.getLatDec(), { emitEvent: false });

    // Fly
    this.flyToDrawnItems();
  }

  /**
   * Draw a marker on drawItems featureGroup with decimal input values
   */
  addMarkerFromLatLngCoord() {
    // clear drawn items layer
    this.clearDrawnItemsLayer();

    // update map toolbar
    this.setMapEditMode();

    // TODO check latitude and longitude values (format + limits)
    const geopoint = new GeoPoint(Number(this.latlngFormGroup.controls.lngInput.value), Number(this.latlngFormGroup.controls.latInput.value));
    leafletObjects.draggableMarker(geopoint.getLatDec(), geopoint.getLonDec(), (dragEnd) => { /* dragend callback fn */ this.callGeolocElevationApisUsingLatLngInputsValues(); }).addTo(this.drawnItems);

    // Set dmsLatLng inputs
    this.latlngFormGroup.controls.dmsLatInput.setValue(geopoint.getLatDeg(), { emitEvent: false });
    this.latlngFormGroup.controls.dmsLngInput.setValue(geopoint.getLonDeg(), { emitEvent: false });

    // Fly
    this.flyToDrawnItems();
  }

  /**
  * Draw a polyline on drawItems featureGroup
  */
  addPolyline(coordinates: LatLngExpression[]) {
    // clear drawn items layer
    this.clearDrawnItemsLayer();

    // update map toolbar
    this.setMapEditMode();

    // draw
    const polyline = L.polyline(coordinates);
    polyline.addTo(this.drawnItems);

    // fly with max zoom
    this.flyToDrawnItems(18);
  }

  /**
   * Take latitude and longitude input values and call geocoding and elevation API
   * Sometimes you may want to force the elevation value and avoid calling elevation API (eg. elevation come from gps photo metadata)
   * then, you cas use the avoidCallingElevationApi option
   *
   * What is done inside this function :
   * - create an observable that zip all required observables
   * - do a switchmap on the main observable so that if one one the sub-observable change, old data are ignored
   * - if a callback is NOT provided, when the main observable is finished, send new location Output
   *
   * Several if / else avoidCallingElevationApi are used because when
   * avoidCallingElevationApi === false, httpTasks returns a single value (osmPlace)
   * whereas if avoidCallingElevationApi === true, httpTasks returns an array of 2 values [elevation, osmPlace]
   */
  callGeolocElevationApisUsingLatLngInputsValues(avoidCallingElevationApi = false, avoidCallingGeolocApi = false, callback?: Function): void {
    this.osmPlace = null;
    this.setLatLngInputFromDrawnItems();
    this.setLatLngDmsInputFromDrawnItems();
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
      this.osmPlace = osmPlace;

      // Set elevation input
      if (!avoidCallingElevationApi) { this.elevationFormGroup.controls.elevationInput.setValue(elevation, {emitEvent: false}); }

      // Patch place input value
      if (!avoidCallingGeolocApi) {
        this.geoSearchFormGroup.controls.placeInput.patchValue(this.geocodeService.getReadbleAddress(osmPlace), {emitEvent: false});
      }

      // callback ?
      if (isDefined(callback)) {
        callback(elevation, osmPlace);
      } else {
        // bind _location & emit location
        if (avoidCallingElevationApi) {
          this.bindLocationOutput([this.elevationFormGroup.controls.elevationInput.value, osmPlace]);
        } else {
          this.bindLocationOutput(result);
        }
      }

    }, error => {
      // Manage error
      // spinnners off
      this.isLoadingAddress = false;
      this.isLoadingElevation = false;
    });
  }

  /**
   * Set latitude and longitude in decimal format from drawItems featureGroup
   * Should be improved for complex polygons / polylines ?
   * Could use turf.js
   */
  setLatLngInputFromDrawnItems(): void {
    const centroid = this.drawnItems.getBounds().getCenter();
    this.latlngFormGroup.controls.latInput.setValue(centroid.lat);
    this.latlngFormGroup.controls.lngInput.setValue(centroid.lng);
  }

  /**
   * Set input latitude and longitude in DMS format drawItems featureGroup
   */
  setLatLngDmsInputFromDrawnItems(): void {
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
   * Reverse geocoding from lat / lng inputs values
   */
  reverseGeocodingFromInputValue(): Observable<any> {
    return this.geocodeService.reverse(this.latlngFormGroup.controls.latInput.value, this.latlngFormGroup.controls.lngInput.value);
  }

  /**
   * Latitude / longitude DMS form Validator
   */
  latLngDmsValidator(control: FormControl) {
    const regexp = new RegExp('^(\\-)?[0-9]{1,2}\\° [0-9]{1,2}\\\' [0-9]{1,2}\\.[0-9]{1,12}\\"');
    return regexp.test(control.value) ? null : { malformedLatLngDmsFormat: true };
  }

  /**
   * Latitude / longitude decimal form validator
   */
  latLngDecValidator(control: FormControl) {
    const regexp = new RegExp('^(\\-)?[0-9]{1,2}\\.[0-9]{1,20}');
    return regexp.test(control.value) ? null : { malformedLatLngDecFormat: true };
  }

  /**
   * When user select an address within the autocomplete results list
   *
   * Call the geoloc API 2 times :
   *  - first call is for reverse geocoding
   *  - second call is for geoconding, so the address input (placeInput) is updated
   */
  addressSelectedChanged(event: MatAutocompleteSelectedEvent) {
    const osmPlace = event.option.value;
    // Fit map bounds
    const southWest = new L.LatLng(osmPlace.boundingbox[0], osmPlace.boundingbox[2]);
    const northEast = new L.LatLng(osmPlace.boundingbox[1], osmPlace.boundingbox[3]);
    this.map.fitBounds(L.latLngBounds(southWest, northEast));

    // Add geojson to the map (if user enter a city, draw the administrative shape on the map)
    this.clearGeoResultsLayer();
    this.geoResultsLayer.addData(osmPlace.geojson);

    // Fly
    this.flyToGeoResultsItems();

    // Patch input value
    this.geoSearchFormGroup.controls.placeInput.patchValue(this.geocodeService.getReadbleAddress(osmPlace), {emitEvent: false});
    // Fill latitude, longitude & altitude inputs
    const g = new GeoPoint(Number(osmPlace.lon), Number(osmPlace.lat));
    this.latlngFormGroup.controls.latInput.setValue(osmPlace.lat, {emitEvent: false});
    this.latlngFormGroup.controls.lngInput.setValue(osmPlace.lon, {emitEvent: false});
    this.latlngFormGroup.controls.dmsLatInput.setValue(g.getLatDeg() , {emitEvent: false});
    this.latlngFormGroup.controls.dmsLngInput.setValue(g.getLonDeg(), {emitEvent: false});
    this.elevationFormGroup.controls.elevationInput.setValue(osmPlace.elevation, {emitEvent: false});

    // Draw a polyline or place a marker at the center of a polygon
    if (osmPlace.geojson.type === 'LineString') {
      // osm geojson coordinates is like [[long, lat], [long, lat], ...]
      // but leaflet needs [[lat, long], [lat, long], ...] format !
      if (this.getOsmSimpleLine) {
        this.addPolyline(this.geocodeService.reverseCorrdinatesArray(
          this.geocodeService.simplifyPolyline(osmPlace.geojson.coordinates)) as LatLngExpression[]
        );
      } else {
        this.addPolyline(this.geocodeService.reverseCorrdinatesArray(osmPlace.geojson.coordinates) as LatLngExpression[]
        );
      }
      this.clearGeoResultsLayer();
    } else {
      this.addMarkerFromLatLngCoord();
    }

    // Call geoloc and elevation APIs
    this.callGeolocElevationApisUsingLatLngInputsValues(false, true, (data: Array<any> | any) => {
      let _elevation: any;
      if (Array.isArray(data)) {
        _elevation = data[0];
      } else {
        _elevation = data;
      }
      // At this time, callGeolocElevationApisUsingLatLngInputsValues set this.osmPlace = null
      // But we already got it from event.option.value
      this.osmPlace = osmPlace;
      this.bindLocationOutput([_elevation, osmPlace]);
    });

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
   * @param data data[0] = elevation, data[1] = osm data | data = osm data
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
    this._location.geometry = this.drawnItems.toGeoJSON();
    // geodatum
    this._location.elevation = elevation;
    this._location.localityConsistency = this._location.localityConsistency ? true : null;   // perform : Cohérence entre les coordonnées et la localité
    this._location.locationAccuracy = this._location.locationAccuracy ? 0 : null;         // perform : Précision (ou incertitude) de la localisation, en mètres --> voir le nombre de décimales pour decLatInput ou decLngInput si point, sinon, demi-longeur de la bounding-box
    // published_location : Précision géographique à laquelle est publiée l'obs, permet de gérer le floutage - Précise, Localité, Maille 10x10km

    this._location.osmCountry = osmPlace.address.country;
    this._location.osmCountryCode = osmPlace.address.country_code;
    this._location.osmCounty = osmPlace.address.county;
    this._location.osmPostcode = osmPlace.address.postcode;
    if (osmPlace.address.city) { this._location.locality = osmPlace.address.city; }
    if (osmPlace.address.town) { this._location.locality = osmPlace.address.town; }
    if (osmPlace.address.village) { this._location.locality = osmPlace.address.village; }

    this._location.sublocality = osmPlace.hamlet;

    this._location.osmRoad = osmPlace.address.road;
    this._location.osmState = osmPlace.address.state;
    this._location.osmSuburb = osmPlace.address.suburb;

    this._location.osmId = osmPlace.osm_id;
    this._location.osmNeighbourhood = null;      // not provided by nominatim
    this._location.osmPlaceId = osmPlace.place_id;
    this._location.publishedLocation = null;     // perform
    this._location.station = null;               // perform

    // Verifications
    // @todo

    // Emit
    this.location.next(this._location);
  }

  /**
   * Change the form coordinates format : 'decimal' or 'dms'
   */
  setLatLngInputFormat(format: string): void {
    if (format !== 'decimal' && format !== 'dms') { return; }
    this.coordFormat = format;
  }

  /**
   * Set inputs values, add a marker and call API for a geolocated photo
   */
  gpsMarkerSetValues(latDec, lngDec, elevation) {
    // set inputs values
    this.latlngFormGroup.controls.latInput.setValue(latDec);
    this.latlngFormGroup.controls.lngInput.setValue(lngDec);
    this.elevationFormGroup.controls.elevationInput.setValue(elevation, {emitEvent: false});

    // add marker
    this.addMarkerFromLatLngCoord();

    // call APIs
    this.callGeolocElevationApisUsingLatLngInputsValues(true, false);

    // clear geolocated photos layer
    this.geolocatedPhotoLatLngLayer.clearLayers();
  }

}
