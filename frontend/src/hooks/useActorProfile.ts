import { useQuery } from '@tanstack/react-query';
import { useOne } from '@refinedev/core';
import { fetchJson } from '@activitypods/refine-providers/utils';

import { authProvider } from '../providers';
import type { ProfileRecord } from '../types';
import { hasTipjarValue } from '../utils/ontology';

/** Resolve any actor's (not just the logged-in user's) public Profile from their WebID —
 *  used to display an ad/comment author's name and avatar, and on the profile page. */
const useActorProfile = (webId?: string) => {
  const session = authProvider.getSession();

  const actorQuery = useQuery({
    queryKey: ['actor', webId],
    queryFn: async () => {
      const { json } = await fetchJson(webId!, {}, session?.token);
      return json as Record<string, any>;
    },
    enabled: !!webId,
    staleTime: 5 * 60 * 1000
  });

  const { result, query } = useOne<ProfileRecord>({
    resource: 'profile',
    id: actorQuery.data?.url,
    queryOptions: { enabled: !!actorQuery.data?.url }
  });

  return {
    data: result,
    /** The WebID document's own `dc:created` — when this actor's account was created. Not on the
     *  Profile resource, so it's read straight off the actor document already fetched above. */
    actorCreated: actorQuery.data?.['dc:created'] as string | undefined,
    /** Whether this actor has a Ğ1 wallet linked to their WebID (`foaf:tipjar`, set by PorteJunes)
     *  -- also read off the actor document, gates the "Envoyer des Ğ1" button in PosterPanel. */
    hasWallet: hasTipjarValue(actorQuery.data?.['foaf:tipjar']),
    isLoading: actorQuery.isLoading || query.isLoading
  };
};

export default useActorProfile;
