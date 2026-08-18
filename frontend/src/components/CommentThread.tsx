import { useState } from 'react';
import { Alert, App, Avatar, Button, Input, Space, Typography } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import useActivityCollection from '../hooks/useActivityCollection';
import useActorProfile from '../hooks/useActorProfile';
import useOutbox from '../hooks/useOutbox';
import type { AnnonceRecord, ReplyRecord } from '../types';

const { Text } = Typography;

const Comment = ({ reply }: { reply: ReplyRecord }) => {
  const { data: author } = useActorProfile(reply.attributedTo);
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      <Avatar src={author?.['vcard:photo']} icon={<UserOutlined />} size="small" />
      <div style={{ flex: 1, background: '#fff', border: '1px solid #f0f0f0', borderRadius: '2px 8px 8px 8px', padding: '8px 12px' }}>
        <Space size={8}>
          <Text strong style={{ fontSize: 13 }}>
            {author?.['vcard:given-name'] || 'Voisin·e'}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {reply.published ? dayjs(reply.published).format('D MMM à HH:mm') : ''}
          </Text>
        </Space>
        <div style={{ whiteSpace: 'pre-wrap' }}>{reply.content}</div>
      </div>
    </div>
  );
};

type Props = {
  annonce: AnnonceRecord;
};

/** Comment thread + reply box for an ad, built on `as:replies` — fully managed server-side by
 *  the Pod provider (posting `Create{Note, inReplyTo}` to the outbox is all that's needed). */
const CommentThread = ({ annonce }: Props) => {
  const { message } = App.useApp();
  const { items: replies, isLoading, invalidate } = useActivityCollection<ReplyRecord>(annonce.replies);
  const outbox = useOutbox();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      await outbox.post({
        type: 'Create',
        actor: outbox.owner,
        object: { type: 'Note', attributedTo: outbox.owner, content, inReplyTo: annonce.id },
        to: annonce['dc:creator']
      });
      setDraft('');
      setTimeout(invalidate, 500);
    } catch (e: any) {
      message.error(e.message);
    }
    setSending(false);
  };

  return (
    <div style={{ marginTop: 16 }}>
      {!isLoading && replies.length === 0 && (
        <Alert type="info" message="Aucun commentaire pour le moment" showIcon style={{ marginBottom: 16 }} />
      )}
      {replies.map(reply => (
        <Comment key={reply.id} reply={reply} />
      ))}
      <Space.Compact style={{ width: '100%', marginTop: 8 }}>
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onPressEnter={send}
          placeholder="Écrire un commentaire"
        />
        <Button type="primary" icon={<SendOutlined />} onClick={send} loading={sending}>
          Envoyer
        </Button>
      </Space.Compact>
    </div>
  );
};

export default CommentThread;
