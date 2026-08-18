import { useState } from 'react';
import { App } from 'antd';

import useActivityCollection from './useActivityCollection';
import useOutbox from './useOutbox';
import { retryRefresh } from '../utils/retry';
import type { AnnonceRecord, ReplyRecord } from '../types';

/** Comment state + posting for an ad, built on `as:replies` — fully managed server-side by the
 *  Pod provider (posting `Create{Note, inReplyTo}` to the outbox is all that's needed). */
const useComments = (annonce: AnnonceRecord) => {
  const { message } = App.useApp();
  const { items: replies, isLoading, invalidate } = useActivityCollection<ReplyRecord>(annonce.replies);
  const outbox = useOutbox();
  const [sending, setSending] = useState(false);

  const send = async (content: string) => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await outbox.post({
        type: 'Create',
        actor: outbox.owner,
        object: { type: 'Note', attributedTo: outbox.owner, content: content.trim(), inReplyTo: annonce.id },
        to: annonce['dc:creator']
      });
      retryRefresh(invalidate);
    } catch (e: any) {
      message.error(e.message);
    }
    setSending(false);
  };

  return { replies, isLoading, sending, send };
};

export default useComments;
