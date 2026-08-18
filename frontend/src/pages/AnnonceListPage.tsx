import { useState } from 'react';
import { Button, Empty, Input, Spin, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useGetIdentity } from '@refinedev/core';
import { useSearchParams } from 'react-router';

import AnnonceCard from '../components/AnnonceCard';
import { useComposer } from '../context/ComposerContext';
import useAnnonces from '../hooks/useAnnonces';
import { FILTER_TITLES, matchesFilter, type FilterId } from '../config/filters';
import { HEADER_HEIGHT } from '../config/layout';
import type { Identity } from '../types';

const { Title, Text } = Typography;

/** WhatsApp-style layout: fixed title header, a scrollable feed in the middle, and a fixed
 *  bottom bar that opens the ad composer — mirrors the mockup's MainPanel exactly. */
const AnnonceListPage = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const { openComposer } = useComposer();
  const [searchParams] = useSearchParams();
  const { items, isLoading } = useAnnonces();
  const [draft, setDraft] = useState('');

  const filter = (searchParams.get('filter') as FilterId) || 'all';
  const filtered = items.filter(a => matchesFilter(a, filter, identity?.id));

  const startAnnonce = () => {
    const content = draft;
    setDraft('');
    openComposer({ initialContent: content || undefined });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: `0 0 ${HEADER_HEIGHT}px`,
          height: HEADER_HEIGHT,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <Title level={4} style={{ margin: 0, lineHeight: '26px' }}>
          {FILTER_TITLES[filter]}
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {filtered.length} annonce{filtered.length !== 1 ? 's' : ''}
          {filter === 'mine' ? ' créée par vous' : ' partagée avec vous'}
        </Text>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isLoading ? (
          <Spin />
        ) : filtered.length === 0 ? (
          <Empty description="Aucune annonce ici pour le moment" style={{ marginTop: 48 }} />
        ) : (
          filtered.map(annonce => <AnnonceCard key={annonce.id} annonce={annonce} kind={annonce.kind} />)
        )}
      </div>

      <div style={{ flex: '0 0 auto', display: 'flex', gap: 10, padding: '12px 16px' }}>
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onPressEnter={startAnnonce}
          placeholder="Créer une nouvelle annonce"
          style={{ borderRadius: 18 }}
        />
        <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={startAnnonce} />
      </div>
    </div>
  );
};

export default AnnonceListPage;
