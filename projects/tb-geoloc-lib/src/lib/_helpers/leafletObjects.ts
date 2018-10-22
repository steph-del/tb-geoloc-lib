/**
 *
 */

import * as L from 'leaflet';

/**
 *
 * @param lat
 * @param lng
 * @param dragend callback
 */
export const draggableMarker = function(lat: number, lng: number, dragend: Function): L.Marker {
  const simpleIcon = simpleIconMarker();
  const marker = L.marker([lat, lng], {icon: simpleIcon, draggable: true});
  marker.on('dragend', function(event) { return dragend(event); });
  return marker;
};

/**
 *
 */
export const simpleIconMarker = function(): L.Icon {
  return L.icon({
    iconUrl: './assets/img/map/marker-icon.png',
    shadowUrl: './assets/img/map/marker-shadow.png',
    iconAnchor: [13, 40]
  });
};

/**
 *
 */
export const drawControlPanel = new L.Control.Draw({
  position: 'topleft',
  draw: {
    marker: { icon: simpleIconMarker() },
    polyline: {},
    polygon: { showArea: true, metric: false },
    rectangle: false,
    circle: false,
    circlemarker: false
  }
});

/**
 *
 * @param editedLayer
 */
export function drawControlEditPanel(editedLayer) {
  return new L.Control.Draw({
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
      edit: false,
      remove: {}
    }
  });
}

/**
 *
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
 *
 */
export const cityStyle = {
  color: '#ff7800',
    weight: 5,
    opacity: 0.65
};

/**
 *
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
 *
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
