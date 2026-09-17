import { isExpired, resourceTypeCurie } from '../utils/ontology';
import type { Annonce } from '../hooks/useAnnonces';

export type FilterId =
  | 'all'
  | 'mine'
  | 'offer'
  | 'offer-atom'
  | 'offer-human'
  | 'offer-other'
  | 'request'
  | 'request-atom'
  | 'request-human'
  | 'request-other';

/** Translation key of a filter's page title ("Toutes les petites annonces", "Offres · Matériel"…). */
export const filterTitleKey = (id: FilterId) => `filters.${id}`;

/** Flat sidebar row list — every row (including group headers) is directly clickable, matching
 *  the mockup: no expand/collapse interaction, hierarchy is shown via weight/indent only. Sub-rows
 *  reuse the bare resource type labels ("Matériel"…), the header row above them giving the context. */
export const FILTER_ROWS: { id: FilterId; labelKey: string; bold?: boolean; indent?: boolean }[] = [
  { id: 'all', labelKey: filterTitleKey('all') },
  { id: 'mine', labelKey: filterTitleKey('mine') },
  { id: 'offer', labelKey: filterTitleKey('offer'), bold: true },
  { id: 'offer-atom', labelKey: 'resource_types.atom', indent: true },
  { id: 'offer-human', labelKey: 'resource_types.human', indent: true },
  { id: 'offer-other', labelKey: 'resource_types.other', indent: true },
  { id: 'request', labelKey: filterTitleKey('request'), bold: true },
  { id: 'request-atom', labelKey: 'resource_types.atom', indent: true },
  { id: 'request-human', labelKey: 'resource_types.human', indent: true },
  { id: 'request-other', labelKey: 'resource_types.other', indent: true }
];

const resourceTypeOf = (annonce: Annonce) =>
  resourceTypeCurie(annonce.kind === 'offer' ? annonce['maid:offerOfResourceType'] : annonce['maid:requestOfResourceType']);

/** Used both for the feed itself and for the sidebar counts (`AppShell`), so the two stay
 *  consistent. Expired ads are hidden from every filter except "Mes petites annonces", where the
 *  author can still see (and edit or delete) them. */
export const matchesFilter = (annonce: Annonce, filter: FilterId, ownWebId?: string): boolean => {
  if (filter === 'mine') return annonce['dc:creator'] === ownWebId;
  if (isExpired(annonce)) return false;

  switch (filter) {
    case 'all':
      return true;
    case 'offer':
      return annonce.kind === 'offer';
    case 'offer-atom':
      return annonce.kind === 'offer' && resourceTypeOf(annonce) === 'pair:AtomBasedResource';
    case 'offer-human':
      return annonce.kind === 'offer' && resourceTypeOf(annonce) === 'pair:HumanBasedResource';
    case 'offer-other':
      return annonce.kind === 'offer' && resourceTypeOf(annonce) === 'pair:Resource';
    case 'request':
      return annonce.kind === 'request';
    case 'request-atom':
      return annonce.kind === 'request' && resourceTypeOf(annonce) === 'pair:AtomBasedResource';
    case 'request-human':
      return annonce.kind === 'request' && resourceTypeOf(annonce) === 'pair:HumanBasedResource';
    case 'request-other':
      return annonce.kind === 'request' && resourceTypeOf(annonce) === 'pair:Resource';
    default:
      return true;
  }
};
