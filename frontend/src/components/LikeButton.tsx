import { useState } from 'react';
import { App, Button } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useGetIdentity } from '@refinedev/core';

import useActivityCollection from '../hooks/useActivityCollection';
import useOutbox from '../hooks/useOutbox';
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
  const { items: likes, isLoading, invalidate } = useActivityCollection<string>(annonce.likes);
  const [pending, setPending] = useState(false);

  const liked = !!identity && likes.includes(identity.id);

  const toggle = async () => {
    if (!identity) return;
    setPending(true);
    try {
      if (liked) {
        await outbox.post({ type: 'Undo', actor: outbox.owner, object: { type: 'Like', actor: outbox.owner, object: annonce.id } });
      } else {
        await outbox.post({ type: 'Like', actor: outbox.owner, object: annonce.id });
      }
      // The collection may take a moment to update server-side; a short delay avoids re-fetching
      // stale data immediately after posting.
      setTimeout(invalidate, 500);
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
