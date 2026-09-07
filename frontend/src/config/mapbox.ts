import { MAPBOX_ACCESS_TOKEN } from './env';
import type { PlaceRecord } from '../types';

export type MapboxFeature = {
  place_name: string;
  place_type: string[];
  text: string;
  center: [number, number];
  context?: { id: string; text: string }[];
};

/** Search addresses/places via the Mapbox Geocoding API. Returns an empty list (rather than
 *  throwing) when no access token is configured. */
export const searchAddress = async (query: string, locale: string): Promise<MapboxFeature[]> => {
  if (!MAPBOX_ACCESS_TOKEN || !query) return [];

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
  url.searchParams.set('types', 'place,address');
  url.searchParams.set('country', 'fr,be,ch');
  url.searchParams.set('language', locale);

  const response = await fetch(url.toString());
  if (!response.ok) return [];
  const json = await response.json();
  return json.features ?? [];
};

/** Build an `as:Place` value (without the radius, set separately by the composer's slider) from
 *  a selected Mapbox feature. */
export const parseAddressFeature = (feature: MapboxFeature): PlaceRecord => ({
  type: 'Place',
  name: feature.place_type[0] === 'place' ? feature.text : feature.place_name,
  latitude: feature.center[1],
  longitude: feature.center[0]
});
