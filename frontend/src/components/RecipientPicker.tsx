import { useMemo, useState } from 'react';
import { useGetIdentity, useList } from '@refinedev/core';
import { Alert, Avatar, Checkbox, Input, List, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

import type { Identity, ProfileRecord } from '../types';

const { Text } = Typography;

type Props = {
  /** WebIds who already have view access — shown checked and disabled. */
  alreadyShared: string[];
  /** WebIds newly selected in this session. */
  selected: string[];
  onChange: (selected: string[]) => void;
};

/** Recipient checklist for sharing an ad, over the `apods:contacts`-derived `profile` list (only
 *  people the app can already read a profile for — i.e. mutual contacts). No groups: view-only,
 *  single tier. */
const RecipientPicker = ({ alreadyShared, selected, onChange }: Props) => {
  const { data: identity } = useGetIdentity<Identity>();
  const [search, setSearch] = useState('');

  const { result, query } = useList<ProfileRecord>({
    resource: 'profile',
    pagination: { mode: 'off' },
    sorters: [{ field: 'vcard:given-name', order: 'asc' }]
  });

  const contacts = useMemo(
    () =>
      result.data
        .filter(profile => profile.describes !== identity?.id)
        .filter(profile => (profile['vcard:given-name'] || '').toLowerCase().includes(search.toLowerCase())),
    [result, search, identity]
  );

  const toggle = (webId: string) => {
    onChange(selected.includes(webId) ? selected.filter(id => id !== webId) : [...selected, webId]);
  };

  return (
    <div>
      <Input.Search
        placeholder="Rechercher"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />
      <List
        loading={query.isLoading}
        dataSource={contacts}
        locale={{ emptyText: ' ' }}
        renderItem={profile => {
          const already = alreadyShared.includes(profile.describes);
          return (
            <List.Item style={{ cursor: already ? 'default' : 'pointer' }} onClick={() => !already && toggle(profile.describes)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%' }}>
                <Avatar src={profile['vcard:photo']} icon={<UserOutlined />} size="small" />
                <Text style={{ flex: 1 }}>{profile['vcard:given-name']}</Text>
                <Checkbox checked={already || selected.includes(profile.describes)} disabled={already} />
              </div>
            </List.Item>
          );
        }}
      />
      {!query.isLoading && contacts.length === 0 && (
        <Alert
          type="warning"
          showIcon
          message="Aucun contact pour le moment. Demandez à être mis en contact depuis la page profil d'un voisin."
        />
      )}
    </div>
  );
};

export default RecipientPicker;
