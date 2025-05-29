import * as L from 'leaflet';

export interface Point {
  id: string;
  latlng: L.LatLng;
  type: 'distribution-center' | 'delivery-point';
}

export interface Strategy {
  name: string;
  description: string;
}