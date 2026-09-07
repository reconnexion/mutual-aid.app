import { useQuery, useQueryClient } from '@tanstack/react-query';
import { arrayOf, fetchJson } from '@activitypods/refine-providers/utils';

import { authProvider } from '../providers';

const EMPTY_ITEMS: any[] = [];

/**
 * Read an ActivityPub (Ordered)Collection at a given URI — used for `replies` (comments, returned
 * fully dereferenced) and `likes` (actor URIs). Follows the collection's `first` page if it has
 * one; these collections are small and bounded so a single page fetch is enough.
 */
const useActivityCollection = <T = any,>(collectionUri?: string) => {
  const session = authProvider.getSession();
  const queryClient = useQueryClient();

  const queryKey = ['activity-collection', collectionUri];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let { json } = await fetchJson(collectionUri!, {}, session?.token);

      if ((json.type === 'OrderedCollection' || json.type === 'Collection') && json.first) {
        const firstItems = json.first?.items || json.first?.orderedItems;
        if (!firstItems) {
          ({ json } = await fetchJson(typeof json.first === 'string' ? json.first : json.first.id, {}, session?.token));
        } else {
          json = json.first;
        }
      }

      return arrayOf<T>(json.orderedItems || json.items);
    },
    enabled: !!collectionUri && !!session,
    retry: false
  });

  return {
    items: query.data ?? EMPTY_ITEMS,
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey })
  };
};

export default useActivityCollection;
