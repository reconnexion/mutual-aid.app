import { useState } from 'react';
import { App, Button } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useGetIdentity, useInvalidate } from '@refinedev/core';

import useActivityCollection from '../hooks/useActivityCollection';
import useOutbox from '../hooks/useOutbox';
import { retryRefresh } from '../utils/retry';
import type { AnnonceKind, AnnonceRecord, Identity } from '../types';

type Props = {
  annonce: AnnonceRecord;
  kind: AnnonceKind;
};

/** `Like`/`Undo{Like}` toggle. The Pod auto-maintains an `as:likes` collection (actor URIs) on
 *  the object once at least one `Like` has been posted — we just read and toggle it. */
const LikeButton = ({ annonce, kind }: Props) => {
  const { message } = App.useApp();
  const { data: identity } = useGetIdentity<Identity>();
  const outbox = useOutbox();
  const invalidate = useInvalidate();
  const { items: likes, isLoading, invalidate: invalidateLikes } = useActivityCollection<string>(annonce.likes);
  const [pending, setPending] = useState(false);

  const liked = !!identity && likes.includes(identity.id);

  const toggle = async () => {
    if (!identity) return;
    setPending(true);
    try {
      // `to` is required for delivery to the ad owner's inbox — without it, the Like never
      // reaches them, and their `as:likes` collection (what everyone else reads) never updates.
      // Posted with the plain AS2 context (`postPlain`, not `post`): merging in our app's own
      // backend context here breaks the Pod's first-time `as:likes` collection creation — Like
      // doesn't touch any of our custom maid:/pair: properties anyway, so it doesn't need it.
      if (liked) {
        await outbox.postPlain({
          type: 'Undo',
          actor: outbox.owner,
          object: { type: 'Like', actor: outbox.owner, object: annonce.id },
          to: annonce['dc:creator']
        });
      } else {
        await outbox.postPlain({ type: 'Like', actor: outbox.owner, object: annonce.id, to: annonce['dc:creator'] });
      }
      retryRefresh(() => {
        invalidateLikes();
        // The very first like attaches a brand new `as:likes` collection to the annonce itself —
        // without this, its URI never reaches this component (same issue as first comments).
        if (!annonce.likes) invalidate({ resource: kind, id: annonce.id, invalidates: ['detail', 'list'] });
      });
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
