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

export const FILTER_TITLES: Record<FilterId, string> = {
  all: 'Toutes les petites annonces',
  mine: 'Mes petites annonces',
  offer: 'Offres',
  'offer-atom': 'Offres · Matériel',
  'offer-human': 'Offres · Compétence',
  'offer-other': 'Offres · Autre',
  request: 'Demandes',
  'request-atom': 'Demandes · Matériel',
  'request-human': 'Demandes · Compétence',
  'request-other': 'Demandes · Autre'
};

/** Flat sidebar row list — every row (including group headers) is directly clickable, matching
 *  the mockup: no expand/collapse interaction, hierarchy is shown via weight/indent only. */
export const FILTER_ROWS: { id: FilterId; label: string; bold?: boolean; indent?: boolean }[] = [
  { id: 'all', label: FILTER_TITLES.all },
  { id: 'mine', label: FILTER_TITLES.mine },
  { id: 'offer', label: FILTER_TITLES.offer, bold: true },
  { id: 'offer-atom', label: 'Matériel', indent: true },
  { id: 'offer-human', label: 'Compétence', indent: true },
  { id: 'offer-other', label: 'Autre', indent: true },
  { id: 'request', label: FILTER_TITLES.request, bold: true },
  { id: 'request-atom', label: 'Matériel', indent: true },
  { id: 'request-human', label: 'Compétence', indent: true },
  { id: 'request-other', label: 'Autre', indent: true }
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
