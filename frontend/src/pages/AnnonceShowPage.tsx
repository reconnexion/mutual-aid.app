import { useState } from 'react';
import { Button, Input, Result, Spin, Typography } from 'antd';
import { ArrowLeftOutlined, EditOutlined, SendOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useGetIdentity, useOne } from '@refinedev/core';
import { Link, useNavigate, useParams } from 'react-router';

import AnnonceCard from '../components/AnnonceCard';
import CommentList from '../components/CommentList';
import PosterPanel from '../components/PosterPanel';
import useActorProfile from '../hooks/useActorProfile';
import useComments from '../hooks/useComments';
import { useComposer } from '../context/ComposerContext';
import { HEADER_HEIGHT } from '../config/layout';
import { retryRefresh } from '../utils/retry';
import type { AnnonceKind, AnnonceRecord, Identity } from '../types';

const { Title } = Typography;

const AnnonceShowPage = () => {
  const { kind, id } = useParams<{ kind: AnnonceKind; id: string }>();
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const { data: identity } = useGetIdentity<Identity>();
  const { openComposer } = useComposer();

  const { result: annonce, query } = useOne<AnnonceRecord>({
    resource: kind,
    id: id ? decodeURIComponent(id) : undefined,
    queryOptions: { enabled: !!kind && !!id }
  });
  const { data: author } = useActorProfile(annonce?.['dc:creator']);
  const { replies, isLoading: repliesLoading, sending, send } = useComments(annonce || ({} as AnnonceRecord));
  const mine = !!annonce && annonce['dc:creator'] === identity?.id;

  if (query.isLoading) return <Spin style={{ margin: 48 }} />;
  if (!annonce) return <Result status="404" title="Annonce introuvable" extra={<Link to="/annonces">Retour</Link>} />;

  const submitComment = async () => {
    const content = draft;
    setDraft('');
    await send(content);
    // The very first comment attaches a brand new `as:replies` collection to the annonce itself
    // — refetch it too (not just the collection), or its URI never reaches this page's state.
    if (!annonce.replies) retryRefresh(() => query.refetch());
  };

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            flex: `0 0 ${HEADER_HEIGHT}px`,
            height: HEADER_HEIGHT,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 16px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0'
          }}
        >
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)} />
          <Title level={5} style={{ margin: 0, flex: 1, minWidth: 0 }}>
            Annonce de {author?.['vcard:given-name'] || 'Voisin·e'}
          </Title>
          {mine && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => openComposer({ mode: 'edit', kind, annonce })}>
                Modifier
              </Button>
              <Button size="small" icon={<ShareAltOutlined />} onClick={() => openComposer({ mode: 'share', kind, annonce })}>
                Partager
              </Button>
            </>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnnonceCard annonce={annonce} kind={kind!} showOwnerActions={false} />
          <CommentList replies={replies} isLoading={repliesLoading} annonceCreator={annonce['dc:creator']} />
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', gap: 10, padding: '12px 16px' }}>
          <Input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onPressEnter={submitComment}
            placeholder="Écrire un commentaire"
            style={{ borderRadius: 18 }}
          />
          <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={submitComment} loading={sending} />
        </div>
      </div>

      <PosterPanel webId={annonce['dc:creator']} />
    </div>
  );
};

export default AnnonceShowPage;
