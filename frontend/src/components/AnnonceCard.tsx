import { Avatar, Button, Space, Tag, Typography } from 'antd';
import { CommentOutlined, EditOutlined, ShareAltOutlined, UserOutlined } from '@ant-design/icons';
import { useGetIdentity } from '@refinedev/core';
import { Link } from 'react-router';
import dayjs from 'dayjs';

import ImageGallery from './ImageGallery';
import LikeButton from './LikeButton';
import useActorProfile from '../hooks/useActorProfile';
import useActivityCollection from '../hooks/useActivityCollection';
import useProfileUrl from '../hooks/useProfileUrl';
import { useComposer } from '../context/ComposerContext';
import { AVATAR_SIZE } from '../config/layout';
import { imagesOf, literalValue, resourceTypeCurie } from '../utils/ontology';
import type { AnnonceKind, AnnonceRecord, Identity } from '../types';

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
  /** Whether to show the "Modifier"/"Partager" banner for the annonce's own creator. Off on the
   *  detail page, which shows those actions in its title bar instead (see `AnnonceShowPage`). */
  showOwnerActions?: boolean;
};

/** A chat-bubble-style card, matching the mockup: the avatar sits beside the bubble (not inside
 *  it), everything left-aligned, flat corner near the avatar — like a received WhatsApp message. */
const AnnonceCard = ({ annonce, kind, showFooter = true, showOwnerActions = true }: Props) => {
  const { data: identity } = useGetIdentity<Identity>();
  const { data: author } = useActorProfile(annonce['dc:creator']);
  const { items: replies } = useActivityCollection(annonce.replies);
  const { openComposer } = useComposer();
  const profileUrl = useProfileUrl();
  const place = annonce.location;
  const images = imagesOf(annonce['pair:depictedBy']);
  const resourceType = resourceTypeOf(annonce, kind);
  const detailUrl = `/annonces/${kind}/${encodeURIComponent(annonce.id)}`;
  const mine = annonce['dc:creator'] === identity?.id;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', maxWidth: 640 }}>
      <Avatar src={author?.['vcard:photo']} icon={<UserOutlined />} size={AVATAR_SIZE} style={{ flex: '0 0 auto' }} />
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
            <a href={profileUrl(annonce['dc:creator'])} target="_blank" rel="noopener noreferrer">
              <Text strong>{author?.['vcard:given-name'] || 'Voisin·e'}</Text>
            </a>
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
            <Paragraph ellipsis={showFooter ? { rows: 3 } : false} style={{ whiteSpace: 'pre-wrap', marginBottom: images.length ? 12 : 8 }}>
              {annonce.content}
            </Paragraph>
          </Link>
          {images.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <ImageGallery images={images} />
            </div>
          )}
          <Space size={8} style={{ fontSize: 12 }}>
            <Text type="secondary">{expiryLabel(annonce)}</Text>
            <Text type="secondary">·</Text>
            <Text type="secondary">{annonce['dc:created'] ? dayjs(annonce['dc:created']).fromNow() : ''}</Text>
          </Space>
        </div>

        {mine && showOwnerActions && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              padding: '8px 14px',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa'
            }}
          >
            <Button size="small" icon={<EditOutlined />} onClick={() => openComposer({ mode: 'edit', kind, annonce })}>
              Modifier
            </Button>
            <Button size="small" icon={<ShareAltOutlined />} onClick={() => openComposer({ mode: 'share', kind, annonce })}>
              Partager
            </Button>
          </div>
        )}

        {showFooter && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderTop: '1px solid #f0f0f0' }}>
            <Link to={detailUrl}>
              <Button type="text" size="small" icon={<CommentOutlined />}>
                {replies.length > 0 ? `${replies.length} commentaire${replies.length > 1 ? 's' : ''}` : 'Commenter'}
              </Button>
            </Link>
            <LikeButton annonce={annonce} kind={kind} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnonceCard;
