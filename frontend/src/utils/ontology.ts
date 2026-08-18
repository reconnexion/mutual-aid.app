/** `maid:offerOfResourceType` / `maid:requestOfResourceType` are typed `@type: "@id"` in the
 *  backend's JSON-LD context (see `backend/services/core/core.service.js`), so a GET returns
 *  them as `{ id: "<full IRI>" }` rather than a compacted CURIE string — unlike what a freshly
 *  submitted form value looks like (`'pair:AtomBasedResource'`). This normalizes either shape
 *  back to the plain CURIE the rest of the UI expects. */
export const resourceTypeCurie = (value: unknown): 'pair:AtomBasedResource' | 'pair:HumanBasedResource' | undefined => {
  const iri = typeof value === 'string' ? value : (value as { id?: string } | undefined)?.id;
  if (!iri) return undefined;
  if (iri.endsWith('AtomBasedResource')) return 'pair:AtomBasedResource';
  if (iri.endsWith('HumanBasedResource')) return 'pair:HumanBasedResource';
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
