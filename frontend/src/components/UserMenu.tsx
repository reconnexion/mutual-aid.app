import { useGetIdentity } from '@refinedev/core';
import { Avatar, Dropdown, Space } from 'antd';
import { AppstoreOutlined, DatabaseOutlined, LogoutOutlined, SettingOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';

import useNodeinfo from '../hooks/useNodeinfo';
import urlJoin from '../utils/urlJoin';
import { authProvider } from '../providers';
import type { Identity } from '../types';

/** Avatar + name dropdown, matching welcometomyplace's `UserMenu`: links to the Pod provider's
 *  own network/apps/data/settings pages (discovered via nodeinfo) plus logout — the single
 *  entry point for account-level actions. */
const UserMenu = () => {
  const { data: identity, isLoading } = useGetIdentity<Identity>();
  const { data: nodeinfo } = useNodeinfo(identity?.id ? new URL(identity.id).host : undefined);

  if (isLoading || !identity?.id) return null;

  const frontendUrl = nodeinfo?.metadata?.frontend_url;

  // Bypass useLogout()'s mutation: the package's authProvider.logout() hardcodes a redirect to
  // this app's own /login, and there's no way to override that from the caller. Calling
  // authProvider.logout() directly still clears the session correctly; the full-page navigation
  // that follows discards all React/Refine state on its own, so there's nothing left to clean up.
  const handleLogout = async () => {
    await authProvider.logout({});
    window.location.href = '/login';
  };

  return (
    <Dropdown
      menu={{
        items: [
          ...(frontendUrl
            ? [
                {
                  key: 'network',
                  label: (
                    <a href={urlJoin(frontendUrl, 'network')} rel="noopener noreferrer">
                      Réseau
                    </a>
                  ),
                  icon: <TeamOutlined />
                },
                {
                  key: 'apps',
                  label: (
                    <a href={urlJoin(frontendUrl, 'apps')} rel="noopener noreferrer">
                      Applications
                    </a>
                  ),
                  icon: <AppstoreOutlined />
                },
                {
                  key: 'data',
                  label: (
                    <a href={urlJoin(frontendUrl, 'data')} rel="noopener noreferrer">
                      Mes données
                    </a>
                  ),
                  icon: <DatabaseOutlined />
                },
                {
                  key: 'settings',
                  label: (
                    <a href={urlJoin(frontendUrl, 'settings')} rel="noopener noreferrer">
                      Paramètres
                    </a>
                  ),
                  icon: <SettingOutlined />
                }
              ]
            : []),
          {
            key: 'logout',
            label: 'Se déconnecter',
            icon: <LogoutOutlined />,
            onClick: () => handleLogout()
          }
        ]
      }}
      trigger={['click']}
    >
      <Space style={{ cursor: 'pointer' }}>
        <Avatar src={identity.avatar} icon={!identity.avatar && <UserOutlined />} style={{ border: '1px solid rgba(255,255,255,0.5)' }} />
      </Space>
    </Dropdown>
  );
};

export default UserMenu;
