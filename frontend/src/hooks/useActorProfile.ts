import { useQuery } from '@tanstack/react-query';
import { useOne } from '@refinedev/core';
import { fetchJson } from '@activitypods/refine-providers/utils';

import { authProvider } from '../providers';
import type { ProfileRecord } from '../types';

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

  return { data: result, isLoading: actorQuery.isLoading || query.isLoading };
};

export default useActorProfile;
