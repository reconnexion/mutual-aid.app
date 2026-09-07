import { useCallback } from 'react';
import { fetchJson } from '@activitypods/refine-providers/utils';

import { authProvider } from '../providers';
import useOwnActor from './useOwnActor';
import urlJoin from '../utils/urlJoin';
import { BACKEND_URL } from '../config/env';

const AS2_CONTEXT = ['https://www.w3.org/ns/activitystreams'];
const DEFAULT_CONTEXT = [...AS2_CONTEXT, urlJoin(new URL(BACKEND_URL).origin, '.well-known/context.jsonld')];

/** The Pod's own `setRightsHandler` grants read access matching an activity's `to`/`cc` the
 *  moment it's posted through the creator's own outbox session — including public read when
 *  this URI is addressed. Comments/likes on an ad need this: addressing `to` with only the ad's
 *  creator grants nothing to anyone else, which is a no-op when the creator is commenting/liking
 *  their own ad (self-addressed). */
export const AS_PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';

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
    async (activity: Record<string, any>, context: string[] = DEFAULT_CONTEXT) => {
      if (!outboxUri) throw new Error('Cannot post to outbox before the user identity is loaded');
      const { headers } = await fetchJson(
        outboxUri,
        { method: 'POST', body: JSON.stringify({ '@context': context, ...activity }) },
        session?.token
      );
      return headers.get('Location');
    },
    [outboxUri, session?.token]
  );

  return { post, postPlain: (activity: Record<string, any>) => post(activity, AS2_CONTEXT), owner: session?.webId, url: outboxUri };
};

export default useOutbox;
