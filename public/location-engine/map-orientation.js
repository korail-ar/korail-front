import { wrap } from './heading-estimator.js';

export function bearingOnMap(from, to) {
  return wrap(Math.atan2(to.x - from.x, from.y - to.y) * 180 / Math.PI);
}
export function geographicBearing(from, to) {
  const radians = Math.PI / 180;
  const lat1 = from.lat * radians, lat2 = to.lat * radians, delta = (to.lng - from.lng) * radians;
  return wrap(Math.atan2(Math.sin(delta) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(delta)) / radians);
}
export function mapCompassOffset(west, east) {
  if (![west.x, west.y, west.lat, west.lng, east.x, east.y, east.lat, east.lng].every(Number.isFinite)) return null;
  if (west.candidateGps?.usableForProduction !== false || east.candidateGps?.usableForProduction !== false) return null;
  return wrap(bearingOnMap(west, east) - geographicBearing(west, east));
}
