import { Empty, Spin, Typography } from 'antd';
import { useGetIdentity } from '@refinedev/core';
import { useSearchParams } from 'react-router';

import AnnonceCard from '../components/AnnonceCard';
import useAnnonces from '../hooks/useAnnonces';
import { FILTER_TITLES, matchesFilter, type FilterId } from '../config/filters';
import type { Identity } from '../types';

const { Title, Text } = Typography;

const AnnonceListPage = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const [searchParams] = useSearchParams();
  const { items, isLoading } = useAnnonces();

  const filter = (searchParams.get('filter') as FilterId) || 'all';
  const filtered = items.filter(a => matchesFilter(a, filter, identity?.id));

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={3}>{FILTER_TITLES[filter]}</Title>
      <Text type="secondary">
        {filtered.length} annonce{filtered.length !== 1 ? 's' : ''}
        {filter === 'mine' ? ' créée par vous' : ' partagée avec vous'}
      </Text>
      <div style={{ marginTop: 16 }}>
        {isLoading ? (
          <Spin />
        ) : filtered.length === 0 ? (
          <Empty description="Aucune annonce ici pour le moment" style={{ marginTop: 48 }} />
        ) : (
          filtered.map(annonce => <AnnonceCard key={annonce.id} annonce={annonce} kind={annonce.kind} />)
        )}
      </div>
    </div>
  );
};

export default AnnonceListPage;
