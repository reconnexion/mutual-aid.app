import { Alert, Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import useActorProfile from '../hooks/useActorProfile';
import useProfileUrl from '../hooks/useProfileUrl';
import { AVATAR_SIZE } from '../config/layout';
import type { ReplyRecord } from '../types';

const { Text } = Typography;

/** A comment bubble — right-aligned (light blue) for everyone except the ad's own creator, whose
 *  replies appear left-aligned (white, like the ad itself) to stand out as "the owner's word". */
const Comment = ({ reply, fromOwner }: { reply: ReplyRecord; fromOwner: boolean }) => {
  const { data: author } = useActorProfile(reply.attributedTo);
  const profileUrl = useProfileUrl();
  const avatar = <Avatar src={author?.['vcard:photo']} icon={<UserOutlined />} size={AVATAR_SIZE} style={{ flex: '0 0 auto' }} />;
  const bubble = (
    <div
      style={{
        maxWidth: 480,
        background: fromOwner ? '#fff' : '#e6f4ff',
        border: `1px solid ${fromOwner ? '#f0f0f0' : '#bae0ff'}`,
        borderRadius: fromOwner ? '2px 8px 8px 8px' : '8px 2px 8px 8px',
        boxShadow: fromOwner ? '0 1px 2px rgba(0,0,0,0.05)' : undefined,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <a href={reply.attributedTo && profileUrl(reply.attributedTo)} target="_blank" rel="noopener noreferrer">
        <Text strong style={{ fontSize: 13, color: fromOwner ? undefined : '#0958d9' }}>
          {author?.['vcard:given-name'] || 'Voisin·e'}
        </Text>
      </a>
      <div style={{ whiteSpace: 'pre-wrap' }}>{reply.content}</div>
      <Text type="secondary" style={{ fontSize: 11, alignSelf: 'flex-end' }}>
        {reply['dc:created'] ? dayjs(reply['dc:created']).fromNow() : ''}
      </Text>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: fromOwner ? 'flex-start' : 'flex-end' }}>
      {fromOwner ? (
        <>
          {avatar}
          {bubble}
        </>
      ) : (
        <>
          {bubble}
          {avatar}
        </>
      )}
    </div>
  );
};

type Props = {
  replies: ReplyRecord[];
  isLoading: boolean;
  /** The ad's own creator — their comments are shown left-aligned instead of right. */
  annonceCreator: string;
};

/** Comment bubbles for the scrollable area of the ad detail page (see `useComments` for the
 *  reply-posting logic, rendered separately in the page's fixed bottom bar). */
const CommentList = ({ replies, isLoading, annonceCreator }: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {!isLoading && replies.length === 0 && <Alert type="info" message="Aucun commentaire pour le moment" showIcon />}
    {replies.map(reply => (
      <Comment key={reply.id} reply={reply} fromOwner={reply.attributedTo === annonceCreator} />
    ))}
  </div>
);

export default CommentList;
