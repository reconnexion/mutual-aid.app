import { useList } from '@refinedev/core';

import type { AnnonceKind, AnnonceRecord } from '../types';

export type Annonce = AnnonceRecord & { kind: AnnonceKind };

/** Combines the `offer` and `request` containers into one merged, newest-first feed. Both
 *  containers already include ads shared with the user (the Pod attaches them automatically),
 *  so no separate "shared with me" query is needed. */
const useAnnonces = () => {
  const offers = useList<AnnonceRecord>({ resource: 'offer', pagination: { mode: 'off' } });
  const requests = useList<AnnonceRecord>({ resource: 'request', pagination: { mode: 'off' } });

  const items: Annonce[] = [
    ...offers.result.data.map(a => ({ ...a, kind: 'offer' as const })),
    ...requests.result.data.map(a => ({ ...a, kind: 'request' as const }))
  ].sort((a, b) => (b['dc:created'] || '').localeCompare(a['dc:created'] || ''));

  return {
    items,
    isLoading: offers.query.isLoading || requests.query.isLoading
  };
};

export default useAnnonces;
