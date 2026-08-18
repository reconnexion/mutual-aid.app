import { Avatar, Space, Tag, Typography } from 'antd';
import { CommentOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import dayjs from 'dayjs';

import LikeButton from './LikeButton';
import useActorProfile from '../hooks/useActorProfile';
import useActivityCollection from '../hooks/useActivityCollection';
import { literalValue, resourceTypeCurie } from '../utils/ontology';
import type { AnnonceKind, AnnonceRecord } from '../types';

const { Paragraph, Text } = Typography;

export const CAT_LABEL: Record<AnnonceKind, string> = { offer: 'Offre', request: 'Demande' };
export const CAT_COLOR: Record<AnnonceKind, string> = { offer: 'green', request: 'blue' };

export const resourceTypeOf = (annonce: AnnonceRecord, kind: AnnonceKind) =>
  resourceTypeCurie(kind === 'offer' ? annonce['maid:offerOfResourceType'] : annonce['maid:requestOfResourceType']);

export const SUB_LABEL: Record<string, string> = {
  'pair:AtomBasedResource': 'Matériel',
  'pair:HumanBasedResource': 'Compétence'
};

export const expiryLabel = (annonce: AnnonceRecord) => {
  const expirationDate = literalValue(annonce['maid:expirationDate']);
  if (!expirationDate) return 'Sans expiration';
  const days = dayjs(expirationDate).diff(dayjs(), 'day');
  if (days < 0) return 'Expirée';
  if (days === 0) return "Expire aujourd'hui";
  return `Expire dans ${days} j`;
};

type Props = {
  annonce: AnnonceRecord;
  kind: AnnonceKind;
  showFooter?: boolean;
};

/** A chat-bubble-style card, matching the mockup: the avatar sits beside the bubble (not inside
 *  it), everything left-aligned, flat corner near the avatar — like a received WhatsApp message. */
const AnnonceCard = ({ annonce, kind, showFooter = true }: Props) => {
  const { data: author } = useActorProfile(annonce['dc:creator']);
  const { items: replies } = useActivityCollection(annonce.replies);
  const place = annonce.location;
  const resourceType = resourceTypeOf(annonce, kind);
  const detailUrl = `/annonces/${kind}/${encodeURIComponent(annonce.id)}`;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', maxWidth: 640 }}>
      <Avatar src={author?.['vcard:photo']} icon={<UserOutlined />} style={{ flex: '0 0 auto' }} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: '2px 8px 8px 8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '10px 14px 8px' }}>
          <Space size={8} wrap style={{ marginBottom: 4 }}>
            <Text strong>{author?.['vcard:given-name'] || 'Voisin·e'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {place?.name}
              {place?.radius ? ` · ${place.radius} km` : ''}
            </Text>
          </Space>
          <div style={{ marginBottom: 8 }}>
            <Tag color={CAT_COLOR[kind]}>{CAT_LABEL[kind]}</Tag>
            {resourceType && <Tag color="geekblue">{SUB_LABEL[resourceType] || resourceType}</Tag>}
          </div>
          <Link to={detailUrl} style={{ color: 'inherit' }}>
            <Paragraph
              ellipsis={showFooter ? { rows: 3 } : false}
              style={{ whiteSpace: 'pre-wrap', marginBottom: annonce['pair:depictedBy'] ? 12 : 8 }}
            >
              {annonce.content}
            </Paragraph>
          </Link>
          {annonce['pair:depictedBy'] && (
            <img
              src={annonce['pair:depictedBy']}
              alt=""
              style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, marginBottom: 8, display: 'block' }}
            />
          )}
          <Space size={8} style={{ fontSize: 12 }}>
            <Text type="secondary">{expiryLabel(annonce)}</Text>
            <Text type="secondary">·</Text>
            <Text type="secondary">{annonce['dc:created'] ? dayjs(annonce['dc:created']).format('D MMM à HH:mm') : ''}</Text>
          </Space>
        </div>
        {showFooter && (
          <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0' }}>
            <Link to={detailUrl} style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0', color: '#1677ff' }}>
                <CommentOutlined />
                {replies.length > 0 ? `${replies.length} commentaire${replies.length > 1 ? 's' : ''}` : 'Commenter'}
              </div>
            </Link>
            <div style={{ width: 1, background: '#f0f0f0' }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <LikeButton annonce={annonce} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnonceCard;
