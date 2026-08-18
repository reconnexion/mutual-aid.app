import { resourceTypeCurie } from '../utils/ontology';
import type { Annonce } from '../hooks/useAnnonces';

export type FilterId = 'all' | 'mine' | 'offer' | 'offer-atom' | 'offer-human' | 'request' | 'request-atom' | 'request-human';

export const FILTER_TITLES: Record<FilterId, string> = {
  all: 'Toutes les annonces',
  mine: 'Mes annonces',
  offer: 'Offres',
  'offer-atom': 'Offres · Matériel',
  'offer-human': 'Offres · Compétence',
  request: 'Demandes',
  'request-atom': 'Demandes · Matériel',
  'request-human': 'Demandes · Compétence'
};

const resourceTypeOf = (annonce: Annonce) =>
  resourceTypeCurie(annonce.kind === 'offer' ? annonce['maid:offerOfResourceType'] : annonce['maid:requestOfResourceType']);

export const matchesFilter = (annonce: Annonce, filter: FilterId, ownWebId?: string): boolean => {
  switch (filter) {
    case 'all':
      return true;
    case 'mine':
      return annonce['dc:creator'] === ownWebId;
    case 'offer':
      return annonce.kind === 'offer';
    case 'offer-atom':
      return annonce.kind === 'offer' && resourceTypeOf(annonce) === 'pair:AtomBasedResource';
    case 'offer-human':
      return annonce.kind === 'offer' && resourceTypeOf(annonce) === 'pair:HumanBasedResource';
    case 'request':
      return annonce.kind === 'request';
    case 'request-atom':
      return annonce.kind === 'request' && resourceTypeOf(annonce) === 'pair:AtomBasedResource';
    case 'request-human':
      return annonce.kind === 'request' && resourceTypeOf(annonce) === 'pair:HumanBasedResource';
    default:
      return true;
  }
};
