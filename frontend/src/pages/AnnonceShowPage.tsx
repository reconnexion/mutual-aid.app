import { useState } from 'react';
import { Button, Input, Result, Spin, Typography } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useOne } from '@refinedev/core';
import { Link, useNavigate, useParams } from 'react-router';

import AnnonceCard from '../components/AnnonceCard';
import CommentList from '../components/CommentList';
import useActorProfile from '../hooks/useActorProfile';
import useComments from '../hooks/useComments';
import { HEADER_HEIGHT } from '../config/layout';
import { retryRefresh } from '../utils/retry';
import type { AnnonceKind, AnnonceRecord } from '../types';

const { Title } = Typography;

const AnnonceShowPage = () => {
  const { kind, id } = useParams<{ kind: AnnonceKind; id: string }>();
  const navigate = useNavigate();
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

  const submitComment = async () => {
    const content = draft;
    setDraft('');
    await send(content);
    // The very first comment attaches a brand new `as:replies` collection to the annonce itself
    // — refetch it too (not just the collection), or its URI never reaches this page's state.
    if (!annonce.replies) retryRefresh(() => query.refetch());
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
        <Title level={5} style={{ margin: 0 }}>
          Annonce de {author?.['vcard:given-name'] || 'Voisin·e'}
        </Title>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AnnonceCard annonce={annonce} kind={kind!} />
        <CommentList replies={replies} isLoading={repliesLoading} annonceCreator={annonce['dc:creator']} />
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
    </div>
  );
};

export default AnnonceShowPage;
