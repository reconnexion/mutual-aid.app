import { useMemo, useState } from 'react';
import { App } from 'antd';

import useActivityCollection from './useActivityCollection';
import useOutbox, { AS_PUBLIC } from './useOutbox';
import { retryRefresh } from '../utils/retry';
import { collectionUriOf } from '../utils/collections';
import type { AnnonceRecord, ReplyRecord } from '../types';

/** A comment shown before the Pod has added it to `as:replies` — see `send`. */
type PendingReply = ReplyRecord & {
  /** `true` until the outbox accepted the activity. */
  sending: boolean;
  /** Replies already in the collection when it was sent: the one that shows up later with the
   *  same author and content, and isn't among these, is this comment. */
  knownIds: string[];
};

/** Comment state + posting for an ad, built on `as:replies` — fully managed server-side by the
 *  Pod provider (posting `Create{Note, inReplyTo}` to the outbox is all that's needed). */
const useComments = (annonce: AnnonceRecord) => {
  const { message } = App.useApp();
  const { items: serverReplies, isLoading, invalidate } = useActivityCollection<ReplyRecord>(collectionUriOf(annonce, 'replies'));
  const outbox = useOutbox();
  const [pending, setPending] = useState<PendingReply[]>([]);

  // The Pod only adds a comment to `as:replies` a few seconds after it was posted (it goes through
  // a queue), so it is shown right away, then swapped for the real one once it arrives.
  const replies = useMemo(() => {
    const matched = new Set<string>();
    const stillPending = pending.filter(p => {
      const candidates = serverReplies.filter(r => !matched.has(r.id) && !p.knownIds.includes(r.id) && r.attributedTo === p.attributedTo);
      // Same text first; else any new reply of ours, in case the Pod reformatted the content.
      const arrived = candidates.find(r => r.content === p.content) ?? candidates[0];
      if (arrived) matched.add(arrived.id);
      return !arrived;
    });
    return [...serverReplies, ...stillPending];
  }, [serverReplies, pending]);

  /** Resolves to `false` if the comment couldn't be posted (it is then removed from the list). */
  const send = async (content: string): Promise<boolean> => {
    const text = content.trim();
    if (!text) return true;
    const id = `pending:${Date.now()}`;
    setPending(list => [
      ...list,
      { id, content: text, attributedTo: outbox.owner, 'dc:created': new Date().toISOString(), sending: true, knownIds: serverReplies.map(r => r.id) }
    ]);
    try {
      await outbox.post({
        type: 'Create',
        actor: outbox.owner,
        // `summary` (not just `content`) is what the notification pipeline reads for the
        // notification's own body — see `invitation.service.js`'s `comment` handler.
        object: { type: 'Note', attributedTo: outbox.owner, content: text, summary: text, inReplyTo: annonce.id },
        // Comments must be visible to everyone who can see the ad, not just its creator — public
        // addressing is what makes the Pod grant that (see AS_PUBLIC's doc comment).
        to: [annonce['dc:creator'], AS_PUBLIC]
      });
      setPending(list => list.map(p => (p.id === id ? { ...p, sending: false } : p)));
      retryRefresh(invalidate, [800, 2000, 4000, 8000]);
      return true;
    } catch (e: any) {
      setPending(list => list.filter(p => p.id !== id));
      message.error(e.message);
      return false;
    }
  };

  return { replies, isLoading, send };
};

export default useComments;
