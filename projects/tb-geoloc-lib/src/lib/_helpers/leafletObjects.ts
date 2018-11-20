import * as L from 'leaflet';

/**
 * Basic draggable marker
 */
export const draggableMarker = function(lat: number, lng: number, dragend: Function): L.Marker {
  const simpleIcon = simpleIconMarker();
  const marker = L.marker([lat, lng], {icon: simpleIcon, draggable: true});
  marker.on('dragend', function(event) { return dragend(event); });
  return marker;
};

/**
 * Basic icon
 */
export const simpleIconMarker = function(): L.Icon {
  return L.icon({
    iconUrl: './assets/img/map/marker-icon.png',
    shadowUrl: './assets/img/map/marker-shadow.png',
    iconAnchor: [13, 40]
  });
};

/**
 * Main control panel
 */
export function drawControlPanel(_marker: boolean, _polyline: boolean, _polygon: boolean) {
  return new L.Control.Draw({
    position: 'topleft',
    draw: {
      marker: _marker ? { icon: simpleIconMarker() } : false,
      polyline: _polyline ? {} : false,
      polygon: _polygon ? { showArea: true, metric: false } : false,
      rectangle: false,
      circle: false,
      circlemarker: false
    }
  });
}

/**
 * Main edit panel
 */
export function drawControlEditPanel(editedLayer, allowEditDrawnItems: boolean) {
  const editOpt: any = allowEditDrawnItems === true ? {} : false;
  const dcep = new L.Control.Draw({
    position: 'topleft',
    draw: {
      marker: false,
      polyline: false,
      polygon: false,
      rectangle: false,
      circle: false,
      circlemarker: false
    },
    edit: {
      featureGroup: editedLayer, // this panel id editing editedLayer
      edit: editOpt,
      remove: {}
    }
  });
  return dcep;
}

/**
 * Simple circle
 */
export const circleMarkerStyle = {
  radius: 6,
  fillColor: '#ff7800',
  color: '#000',
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};

/**
 * Administrative area style
 */
export const cityStyle = {
  color: '#ff7800',
    weight: 5,
    opacity: 0.65
};

/**
 * GPS-photo location icon
 */
export const gpsPhotoMarkerIcon = (): L.Icon => {
  return L.icon({
    iconUrl: './assets/img/map/photo-marker-icon.png',
    shadowUrl: './assets/img/map/marker-shadow.png',

    iconSize:     [33, 41], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [13, 40], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [5, -41] // point from which the popup should open relative to the iconAnchor
  });
};

/**
 * GPS-photo location icon, highlighted
 */
export const gpsPhotoMarkerIconHighlight = (): L.Icon => {
  return L.icon({
    iconUrl: './assets/img/map/photo-marker-icon.png',
    shadowUrl: './assets/img/map/marker-shadow.png',

    iconSize:     [43, 54], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [13, 40], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [0, -76] // point from which the popup should open relative to the iconAnchor
  });
};
