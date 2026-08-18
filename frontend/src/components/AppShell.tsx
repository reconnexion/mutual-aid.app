import { useState, type ReactNode } from 'react';
import { Avatar, Button, Layout, Menu, Space, Typography } from 'antd';
import { LogoutOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { useGetIdentity, useLogout } from '@refinedev/core';
import { Link, useNavigate, useSearchParams } from 'react-router';

import AnnonceComposer from './AnnonceComposer';
import useAnnonces from '../hooks/useAnnonces';
import { FILTER_TITLES, matchesFilter, type FilterId } from '../config/filters';
import { APP_NAME } from '../config/env';
import type { Identity } from '../types';

const { Sider, Content } = Layout;
const { Text } = Typography;

const GROUPS: { key: FilterId; label: string; children?: FilterId[] }[] = [
  { key: 'all', label: FILTER_TITLES.all },
  { key: 'mine', label: FILTER_TITLES.mine },
  { key: 'offer', label: FILTER_TITLES.offer, children: ['offer-atom', 'offer-human'] },
  { key: 'request', label: FILTER_TITLES.request, children: ['request-atom', 'request-human'] }
];

const AppShell = ({ children }: { children: ReactNode }) => {
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [composerOpen, setComposerOpen] = useState(false);
  const { items } = useAnnonces();

  const activeFilter = (searchParams.get('filter') as FilterId) || 'all';

  const countFor = (filter: FilterId) => items.filter(a => matchesFilter(a, filter, identity?.id)).length;

  const menuItems = GROUPS.map(group => ({
    key: group.key,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>{group.label}</span>
        <Text type="secondary">{countFor(group.key)}</Text>
      </div>
    ),
    children: group.children?.map(childKey => ({
      key: childKey,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span>{FILTER_TITLES[childKey].split(' · ')[1]}</span>
          <Text type="secondary">{countFor(childKey)}</Text>
        </div>
      )
    }))
  }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={300} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', background: '#1677ff' }}>
          <Space>
            <span style={{ fontSize: 22 }}>🤝</span>
            <Text strong style={{ color: '#fff', fontSize: 16 }}>
              {APP_NAME}
            </Text>
          </Space>
          <Link to={`/profil/${encodeURIComponent(identity?.id || '')}`}>
            <Avatar src={identity?.avatar} icon={<UserOutlined />} style={{ border: '1px solid rgba(255,255,255,0.5)' }} />
          </Link>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeFilter]}
          defaultOpenKeys={['offer', 'request']}
          items={menuItems}
          onClick={({ key }) => {
            setSearchParams(key === 'all' ? {} : { filter: key });
            navigate({ pathname: '/annonces', search: key === 'all' ? '' : `?filter=${key}` });
          }}
          style={{ borderInlineEnd: 'none' }}
        />
        <div style={{ padding: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} block onClick={() => setComposerOpen(true)}>
            Créer une annonce
          </Button>
          <Button type="text" icon={<LogoutOutlined />} block onClick={() => logout()} style={{ marginTop: 8 }}>
            Se déconnecter
          </Button>
        </div>
      </Sider>
      <Content style={{ background: '#f5f5f5' }}>{children}</Content>
      <AnnonceComposer open={composerOpen} mode="create" kind="offer" onClose={() => setComposerOpen(false)} />
    </Layout>
  );
};

export default AppShell;
