import { useCallback } from 'react';
import { fetchJson } from '@activitypods/refine-providers/utils';

import { authProvider } from '../providers';
import useOwnActor from './useOwnActor';
import urlJoin from '../utils/urlJoin';
import { BACKEND_URL } from '../config/env';

const DEFAULT_CONTEXT = ['https://www.w3.org/ns/activitystreams', urlJoin(new URL(BACKEND_URL).origin, '.well-known/context.jsonld')];

/**
 * Post ActivityStreams2 activities to the logged-in user's own outbox — the mechanism behind
 * sharing an ad (`Announce`), commenting (`Create{Note, inReplyTo}`), liking (`Like`/`Undo`),
 * and the profile contact form (`Create{Note}`, `Offer{Add{profile}}`).
 */
const useOutbox = () => {
  const { data: ownActor } = useOwnActor();
  const session = authProvider.getSession();
  const outboxUri = ownActor?.outbox;

  const post = useCallback(
    async (activity: Record<string, any>) => {
      if (!outboxUri) throw new Error('Cannot post to outbox before the user identity is loaded');
      const { headers } = await fetchJson(
        outboxUri,
        { method: 'POST', body: JSON.stringify({ '@context': DEFAULT_CONTEXT, ...activity }) },
        session?.token
      );
      return headers.get('Location');
    },
    [outboxUri, session?.token]
  );

  return { post, owner: session?.webId, url: outboxUri };
};

export default useOutbox;
