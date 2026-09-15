import type { ResourceType } from '../types';

/** `maid:offerOfResourceType` / `maid:requestOfResourceType` are typed `@type: "@id"` in the
 *  backend's JSON-LD context (see `backend/services/core/core.service.js`), so a GET returns
 *  them as `{ id: "<full IRI>" }` rather than a compacted CURIE string — unlike what a freshly
 *  submitted form value looks like (`'pair:AtomBasedResource'`). This normalizes either shape
 *  back to the plain CURIE the rest of the UI expects. */
export const resourceTypeCurie = (value: unknown): ResourceType | undefined => {
  const iri = typeof value === 'string' ? value : (value as { id?: string } | undefined)?.id;
  if (!iri) return undefined;
  if (iri.endsWith('AtomBasedResource')) return 'pair:AtomBasedResource';
  if (iri.endsWith('HumanBasedResource')) return 'pair:HumanBasedResource';
  // Checked last, since the two above also end with "Resource" (full IRI is `pair#Resource`).
  if (iri.endsWith('#Resource') || iri === 'pair:Resource') return 'pair:Resource';
  return undefined;
};

/** Typed literals (e.g. `maid:expirationDate`, `@type: "xsd:dateTime"`) can come back as a plain
 *  string or, when the backend's compaction doesn't fully resolve the custom datatype, as a
 *  `{ "@value": "...", "@type": "..." }` object — unwrap either shape to the raw string. */
export const literalValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  const wrapped = (value as { '@value'?: string } | undefined)?.['@value'];
  return typeof wrapped === 'string' ? wrapped : undefined;
};

/** Whether an ad's `maid:expirationDate` is in the past. An ad without one never expires.
 *  Expired ads are only ever masked, never deleted (see `matchesFilter` in `config/filters.ts`):
 *  they stay in the Pod, and still show up under "Mes petites annonces" for their author. */
export const isExpired = (annonce: { 'maid:expirationDate'?: unknown }, now = Date.now()): boolean => {
  const expirationDate = literalValue(annonce['maid:expirationDate']);
  if (!expirationDate) return false;
  const time = new Date(expirationDate).getTime();
  return !Number.isNaN(time) && time < now;
};

/** `pair:depictedBy` (an ad's photos) is typed `@type: "@id"`, so — same reasoning as
 *  `resourceTypeCurie` — each value can come back as `{ id: "<url>" }` instead of a plain URL
 *  string, and with more than one photo the whole thing is an array rather than a single value. */
export const imagesOf = (value: unknown): string[] => {
  const list = value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
  return list.map(item => (typeof item === 'string' ? item : (item as { id?: string } | undefined)?.id)).filter((url): url is string => !!url);
};

/** `foaf:tipjar` (a Ğ1 wallet linked to a WebID, set by PorteJunes on wallet creation) may come
 *  back as a bare node reference, a plain string, or (rarely, e.g. stale data from before
 *  PorteJunes started overwriting rather than accumulating it) an array of either -- true as long
 *  as at least one value is actually present. */
export const hasTipjarValue = (value: unknown): boolean => (Array.isArray(value) ? value.length > 0 : Boolean(value));
