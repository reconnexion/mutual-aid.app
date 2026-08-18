import { useState } from 'react';
import { Button, Input, Result, Space, Spin, Typography } from 'antd';
import { ArrowLeftOutlined, EditOutlined, SendOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useGetIdentity, useOne } from '@refinedev/core';
import { Link, useNavigate, useParams } from 'react-router';

import AnnonceCard from '../components/AnnonceCard';
import AnnonceComposer from '../components/AnnonceComposer';
import CommentList from '../components/CommentList';
import useActorProfile from '../hooks/useActorProfile';
import useComments from '../hooks/useComments';
import type { AnnonceKind, AnnonceRecord, Identity } from '../types';

const { Title } = Typography;

const AnnonceShowPage = () => {
  const { kind, id } = useParams<{ kind: AnnonceKind; id: string }>();
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<Identity>();
  const [composerMode, setComposerMode] = useState<'edit' | 'share' | null>(null);
  const [draft, setDraft] = useState('');

  const { result: annonce, query } = useOne<AnnonceRecord>({
    resource: kind,
    id: id ? decodeURIComponent(id) : undefined,
    queryOptions: { enabled: !!kind && !!id }
  });
  const { data: author } = useActorProfile(annonce?.['dc:creator']);
  const { replies, isLoading: repliesLoading, sending, send } = useComments(annonce || ({} as AnnonceRecord));

  if (query.isLoading) return <Spin style={{ margin: 48 }} />;
  if (!annonce) return <Result status="404" title="Annonce introuvable" extra={<Link to="/annonces">Retour</Link>} />;

  const mine = annonce['dc:creator'] === identity?.id;

  const submitComment = async () => {
    const content = draft;
    setDraft('');
    await send(content);
    // The very first comment attaches a brand new `as:replies` collection to the annonce itself
    // — refetch it too (not just the collection), or its URI never reaches this page's state.
    if (!annonce.replies) setTimeout(() => query.refetch(), 600);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)} />
        <Title level={5} style={{ margin: 0 }}>
          Annonce de {author?.['vcard:given-name'] || 'Voisin·e'}
        </Title>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AnnonceCard annonce={annonce} kind={kind!} />
        {mine && (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setComposerMode('edit')}>
              Modifier
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={() => setComposerMode('share')}>
              Partager
            </Button>
          </Space>
        )}
        <CommentList replies={replies} isLoading={repliesLoading} />
      </div>

      <div style={{ flex: '0 0 auto', display: 'flex', gap: 10, padding: '12px 16px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onPressEnter={submitComment}
          placeholder="Écrire un commentaire"
          style={{ borderRadius: 18 }}
        />
        <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={submitComment} loading={sending} />
      </div>

      {composerMode && (
        <AnnonceComposer
          open
          mode={composerMode}
          kind={kind!}
          annonce={annonce}
          onClose={() => setComposerMode(null)}
          onSaved={() => query.refetch()}
        />
      )}
    </div>
  );
};

export default AnnonceShowPage;
