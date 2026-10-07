import { useState } from 'react';
import { App, Button } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useGetIdentity } from '@refinedev/core';

import useActivityCollection from '../hooks/useActivityCollection';
import useOutbox, { AS_PUBLIC } from '../hooks/useOutbox';
import { retryRefresh } from '../utils/retry';
import { collectionUriOf } from '../utils/collections';
import type { AnnonceRecord, Identity } from '../types';

type Props = {
  annonce: AnnonceRecord;
};

/** `Like`/`Undo{Like}` toggle. The Pod auto-maintains an `as:likes` collection (actor URIs) on
 *  the object once at least one `Like` has been posted — we just read and toggle it. */
const LikeButton = ({ annonce }: Props) => {
  const { message } = App.useApp();
  const { data: identity } = useGetIdentity<Identity>();
  const outbox = useOutbox();
  const { items: likes, isLoading, invalidate: invalidateLikes } = useActivityCollection<string>(collectionUriOf(annonce, 'likes'));
  const [pending, setPending] = useState(false);

  const liked = !!identity && likes.includes(identity.id);

  const toggle = async () => {
    if (!identity) return;
    setPending(true);
    try {
      // `to` must reach the ad's creator (for delivery/notification) and be publicly addressed
      // (so the Pod's rights handler grants read to everyone, not just the creator — otherwise a
      // like the creator posts on their own ad, self-addressed, grants nobody else anything).
      // Posted with the plain AS2 context (`postPlain`, not `post`): merging in our app's own
      // backend context here breaks the Pod's first-time `as:likes` collection creation — Like
      // doesn't touch any of our custom maid:/pair: properties anyway, so it doesn't need it.
      const to = [annonce['dc:creator'], AS_PUBLIC];
      if (liked) {
        await outbox.postPlain({ type: 'Undo', actor: outbox.owner, object: { type: 'Like', actor: outbox.owner, object: annonce.id }, to });
      } else {
        await outbox.postPlain({ type: 'Like', actor: outbox.owner, object: annonce.id, to });
      }
      // The collection URI is known even before the first like created it (`collectionUriOf`).
      retryRefresh(invalidateLikes);
    } catch (e: any) {
      message.error(e.message);
    }
    setPending(false);
  };

  return (
    <Button type="text" size="small" onClick={toggle} loading={pending} disabled={isLoading}>
      {likes.length > 0 && <span style={{ marginRight: 4 }}>{likes.length}</span>}
      {liked ? <HeartFilled style={{ color: '#cf1322' }} /> : <HeartOutlined />}
    </Button>
  );
};

export default LikeButton;
