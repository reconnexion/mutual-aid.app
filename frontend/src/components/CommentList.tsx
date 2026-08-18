import { Alert, Avatar, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import useActorProfile from '../hooks/useActorProfile';
import type { ReplyRecord } from '../types';

const { Text } = Typography;

const Comment = ({ reply }: { reply: ReplyRecord }) => {
  const { data: author } = useActorProfile(reply.attributedTo);
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Avatar src={author?.['vcard:photo']} icon={<UserOutlined />} size="small" style={{ flex: '0 0 auto' }} />
      <div style={{ maxWidth: 480, background: '#fff', border: '1px solid #f0f0f0', borderRadius: '2px 8px 8px 8px', padding: '8px 12px' }}>
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
  replies: ReplyRecord[];
  isLoading: boolean;
};

/** Comment bubbles for the scrollable area of the ad detail page (see `useComments` for the
 *  reply-posting logic, rendered separately in the page's fixed bottom bar). */
const CommentList = ({ replies, isLoading }: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {!isLoading && replies.length === 0 && <Alert type="info" message="Aucun commentaire pour le moment" showIcon />}
    {replies.map(reply => (
      <Comment key={reply.id} reply={reply} />
    ))}
  </div>
);

export default CommentList;
