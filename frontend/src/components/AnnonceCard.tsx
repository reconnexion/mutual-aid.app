import { Avatar, Button, Space, Tag, Typography } from 'antd';
import { CommentOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { useTranslate } from '@refinedev/core';
import dayjs from 'dayjs';

import ImageGallery from './ImageGallery';
import LikeButton from './LikeButton';
import useActorProfile from '../hooks/useActorProfile';
import useActivityCollection from '../hooks/useActivityCollection';
import useProfileUrl from '../hooks/useProfileUrl';
import { formatUsername } from '../utils/formatUsername';
import { AVATAR_SIZE } from '../config/layout';
import { exchangeTypeCurie, imagesOf, isExpired, literalValue, resourceTypeCurie } from '../utils/ontology';
import { exchangeTypeLabelKey } from '../config/exchangeTypes';
import type { AnnonceKind, AnnonceRecord } from '../types';

const { Paragraph, Text } = Typography;

export const CAT_COLOR: Record<AnnonceKind, string> = { offer: 'green', request: 'blue' };

export const resourceTypeOf = (annonce: AnnonceRecord, kind: AnnonceKind) =>
  resourceTypeCurie(kind === 'offer' ? annonce['maid:offerOfResourceType'] : annonce['maid:requestOfResourceType']);

export const SUB_LABEL_KEY: Record<string, string> = {
  'pair:AtomBasedResource': 'resource_types.atom',
  'pair:HumanBasedResource': 'resource_types.human',
  'pair:Resource': 'resource_types.other'
};

type Translate = (key: string, options?: any) => string;

export const expiryLabel = (annonce: AnnonceRecord, translate: Translate) => {
  const expirationDate = literalValue(annonce['maid:expirationDate']);
  if (!expirationDate) return translate('card.no_expiry');
  // Same test as the feed's masking, so an ad is never both listed and labelled "Expirée".
  if (isExpired(annonce)) return translate('card.expired');
  const days = dayjs(expirationDate).diff(dayjs(), 'day');
  if (days === 0) return translate('card.expires_today');
  return translate('card.expires_in', { count: days });
};

type Props = {
  annonce: AnnonceRecord;
  kind: AnnonceKind;
  showFooter?: boolean;
};

/** A chat-bubble-style card, matching the mockup: the avatar sits beside the bubble (not inside
 *  it), everything left-aligned, flat corner near the avatar — like a received WhatsApp message.
 *  "Modifier"/"Partager" live only in the detail page's header — not worth repeating here. */
const AnnonceCard = ({ annonce, kind, showFooter = true }: Props) => {
  const translate = useTranslate();
  const { data: author } = useActorProfile(annonce['dc:creator']);
  const { items: replies } = useActivityCollection(annonce.replies);
  const profileUrl = useProfileUrl();
  const place = annonce.location;
  const images = imagesOf(annonce['pair:depictedBy']);
  const resourceType = resourceTypeOf(annonce, kind);
  const exchangeLabelKey = exchangeTypeLabelKey(exchangeTypeCurie(annonce['pair:hasType']));
  const detailUrl = `/annonces/${kind}/${encodeURIComponent(annonce.id)}`;

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
          <div style={{ marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <a href={profileUrl(annonce['dc:creator'])} target="_blank" rel="noopener noreferrer">
              <Text strong>{author?.['vcard:given-name'] || translate('app.neighbour')}</Text>
            </a>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatUsername(annonce['dc:creator'])}
            </Text>
          </div>
          <Space size={8} wrap style={{ marginBottom: 8, display: 'flex' }}>
            {annonce.name && (
              <Text strong style={{ fontSize: 15 }}>
                {annonce.name}
              </Text>
            )}
            <Tag color={CAT_COLOR[kind]}>{translate(`kinds.${kind}`)}</Tag>
            {resourceType && <Tag color="geekblue">{SUB_LABEL_KEY[resourceType] ? translate(SUB_LABEL_KEY[resourceType]) : resourceType}</Tag>}
            {exchangeLabelKey && <Tag color="gold">{translate(exchangeLabelKey)}</Tag>}
          </Space>
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
          <Space size={6} wrap style={{ fontSize: 11, display: 'flex' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {translate('card.posted_on', { date: annonce['dc:created'] ? dayjs(annonce['dc:created']).format(translate('card.date_format')) : '' })}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              ·
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {expiryLabel(annonce, translate)}
            </Text>
            {place?.name && (
              <>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  ·
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {place.name}
                  {place.radius ? ` (${place.radius} km)` : ''}
                </Text>
              </>
            )}
          </Space>
        </div>

        {showFooter && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderTop: '1px solid #f0f0f0' }}>
            <Link to={detailUrl}>
              <Button type="text" size="small" icon={<CommentOutlined />}>
                {replies.length > 0 ? translate('card.comments', { count: replies.length }) : translate('card.comment')}
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
