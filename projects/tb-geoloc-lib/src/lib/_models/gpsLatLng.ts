export interface LatLngDMS {
  lat: DMS;
  lng: DMS;
}

export interface LatLngDMSAltitudePhotoName {
  lat: DMS;
  lng: DMS;
  altitude: number;
  fileName: string;
  latDms?: string;
  lngDms: string;
  latDec?: number;
  lngDec?: number;
}

export interface DMS {
  deg: number;
  min: number;
  sec: number;
}
