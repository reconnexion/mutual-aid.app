import { useState, type ReactNode } from 'react';
import { Button, Layout, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useGetIdentity } from '@refinedev/core';
import { useNavigate, useSearchParams } from 'react-router';

import AnnonceComposer from './AnnonceComposer';
import UserMenu from './UserMenu';
import ComposerContext, { type ComposerRequest } from '../context/ComposerContext';
import useAnnonces from '../hooks/useAnnonces';
import { FILTER_ROWS, matchesFilter, type FilterId } from '../config/filters';
import { APP_NAME } from '../config/env';
import { HEADER_HEIGHT } from '../config/layout';
import type { Identity } from '../types';

const { Sider, Content } = Layout;
const { Text } = Typography;

const AppShell = ({ children }: { children: ReactNode }) => {
  const { data: identity } = useGetIdentity<Identity>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [composerRequest, setComposerRequest] = useState<ComposerRequest | null>(null);
  const { items } = useAnnonces();

  const activeFilter = (searchParams.get('filter') as FilterId) || 'all';

  const countFor = (filter: FilterId) => items.filter(a => matchesFilter(a, filter, identity?.id)).length;

  const selectFilter = (id: FilterId) => navigate({ pathname: '/annonces', search: id === 'all' ? '' : `?filter=${id}` });

  const openComposer = (request?: Partial<ComposerRequest>) =>
    setComposerRequest({ mode: 'create', kind: 'offer', ...request });

  return (
    <ComposerContext.Provider value={{ openComposer }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={360} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div
              style={{
                flex: `0 0 ${HEADER_HEIGHT}px`,
                height: HEADER_HEIGHT,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '0 16px',
                background: '#1677ff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🤝</span>
                <Text strong style={{ color: '#fff', fontSize: 16 }}>
                  {APP_NAME}
                </Text>
              </div>
              <UserMenu />
            </div>

            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '12px 8px' }}>
              {FILTER_ROWS.map(row => {
                const active = activeFilter === row.id;
                return (
                  <div
                    key={row.id}
                    onClick={() => selectFilter(row.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      marginTop: row.bold ? 6 : 0,
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: active ? '#e6f4ff' : 'transparent',
                      lineHeight: '20px'
                    }}
                  >
                    {row.indent && <span style={{ flex: '0 0 14px' }} />}
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: row.bold ? 600 : 400, color: 'rgba(0,0,0,0.88)' }}>
                      {row.label}
                    </span>
                    <Text type="secondary" style={{ fontSize: 12, lineHeight: '20px' }}>
                      {countFor(row.id)}
                    </Text>
                  </div>
                );
              })}
            </div>

            <div style={{ flex: '0 0 auto', padding: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} block onClick={() => openComposer()}>
                Créer une annonce
              </Button>
            </div>
          </div>
        </Sider>
        <Content style={{ background: '#f5f5f5', height: '100vh', overflow: 'hidden' }}>{children}</Content>
        {composerRequest && (
          <AnnonceComposer
            open
            mode={composerRequest.mode}
            kind={composerRequest.kind}
            annonce={composerRequest.annonce}
            initialContent={composerRequest.initialContent}
            onClose={() => setComposerRequest(null)}
          />
        )}
      </Layout>
    </ComposerContext.Provider>
  );
};

export default AppShell;
