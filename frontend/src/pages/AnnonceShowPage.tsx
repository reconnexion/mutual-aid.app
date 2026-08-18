import { useState } from 'react';
import { Button, Result, Space, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useGetIdentity, useOne } from '@refinedev/core';
import { Link, useNavigate, useParams } from 'react-router';

import AnnonceCard from '../components/AnnonceCard';
import AnnonceComposer from '../components/AnnonceComposer';
import CommentThread from '../components/CommentThread';
import type { AnnonceKind, AnnonceRecord, Identity } from '../types';

const AnnonceShowPage = () => {
  const { kind, id } = useParams<{ kind: AnnonceKind; id: string }>();
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<Identity>();
  const [composerMode, setComposerMode] = useState<'edit' | 'share' | null>(null);

  const { result: annonce, query } = useOne<AnnonceRecord>({
    resource: kind,
    id: id ? decodeURIComponent(id) : undefined,
    queryOptions: { enabled: !!kind && !!id }
  });

  if (query.isLoading) return <Spin style={{ margin: 48 }} />;
  if (!annonce) return <Result status="404" title="Annonce introuvable" extra={<Link to="/annonces">Retour</Link>} />;

  const mine = annonce['dc:creator'] === identity?.id;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        Retour
      </Button>
      <AnnonceCard annonce={annonce} kind={kind!} />
      {mine && (
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<EditOutlined />} onClick={() => setComposerMode('edit')}>
            Modifier
          </Button>
          <Button icon={<ShareAltOutlined />} onClick={() => setComposerMode('share')}>
            Partager
          </Button>
        </Space>
      )}
      <CommentThread annonce={annonce} />
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
