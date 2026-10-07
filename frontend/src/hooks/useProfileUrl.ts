import { useGetIdentity } from '@refinedev/core';

import useNodeinfo from './useNodeinfo';
import urlJoin from '../utils/urlJoin';
import { formatUsername } from '../utils/formatUsername';
import type { Identity } from '../types';

/**
 * Builds a link to a WebID's profile on the Pod provider's own frontend (`/network/@user@host`)
 * — this app has no profile page of its own, matching welcometomyplace's `AttendeeAvatar`
 * pattern. The `/network` page lives on the *viewer's own* Pod provider (discovered from their
 * own identity, not the target's — that's how the real ActivityPods frontend links to other
 * people too), and resolves the given handle to whichever actor it points to.
 */
const useProfileUrl = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const { data: nodeinfo } = useNodeinfo(identity?.id ? new URL(identity.id).host : undefined);
  const frontendUrl = nodeinfo?.metadata?.frontend_url;

  return (webId: string): string | undefined => (frontendUrl ? urlJoin(frontendUrl, `network/${formatUsername(webId)}`) : undefined);
};

export default useProfileUrl;
