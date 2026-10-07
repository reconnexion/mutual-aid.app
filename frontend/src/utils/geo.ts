export type GeoPoint = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km (haversine). Plenty accurate for a 5–50 km sharing radius,
 *  especially since contacts' positions are themselves fuzzed by ~1 km on their profile. */
export const distanceKm = (a: GeoPoint, b: GeoPoint): number => {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

/** `vcard:hasGeo` as found on a profile or a saved address — `undefined` unless both
 *  coordinates are present and numeric. */
export const geoPoint = (geo: unknown): GeoPoint | undefined => {
  const latitude = Number((geo as any)?.['vcard:latitude']);
  const longitude = Number((geo as any)?.['vcard:longitude']);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)
    ? { latitude, longitude }
    : undefined;
};
