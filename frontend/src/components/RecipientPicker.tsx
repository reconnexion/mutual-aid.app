import { useMemo, useState } from 'react';
import { useGetIdentity, useList } from '@refinedev/core';
import { Alert, Avatar, Input, List, Switch, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

import type { Identity, InvitationState, ProfileRecord } from '../types';

const { Text } = Typography;

type Props = {
  invitations: Record<string, InvitationState>;
  organizerUri: string;
  /** Whether the current user may grant "can re-share" rights — only the ad's own creator can. */
  isCreator: boolean;
  onChange: (invitations: Record<string, InvitationState>) => void;
};

/** Recipient checklist for sharing an ad, over the `apods:contacts`-derived `profile` list (only
 *  people the app can already read a profile for — i.e. mutual contacts). Each contact gets a
 *  "Voir" toggle and, for the creator only, a "Partager" toggle granting re-share rights. */
const RecipientPicker = ({ invitations, organizerUri, isCreator, onChange }: Props) => {
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
        .filter(profile => profile.describes !== organizerUri && profile.describes !== identity?.id)
        .filter(profile => (profile['vcard:given-name'] || '').toLowerCase().includes(search.toLowerCase())),
    [result, search, organizerUri, identity]
  );

  const changeCanView = (webId: string) => {
    const state = invitations[webId] ?? { canView: false, canShare: false, viewReadonly: false, shareReadonly: !isCreator };
    const canView = !state.canView;
    onChange({ ...invitations, [webId]: { ...state, canView, canShare: canView && state.canShare } });
  };

  const changeCanShare = (webId: string) => {
    const state = invitations[webId] ?? { canView: false, canShare: false, viewReadonly: false, shareReadonly: !isCreator };
    const canShare = !state.canShare;
    onChange({ ...invitations, [webId]: { ...state, canShare, canView: canShare || state.canView } });
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
          const webId = profile.describes;
          const state: InvitationState = invitations[webId] ?? { canView: false, canShare: false, viewReadonly: false, shareReadonly: !isCreator };
          return (
            <List.Item style={{ paddingLeft: 0, paddingRight: 0, gap: 12, flexWrap: 'wrap' }}>
              <List.Item.Meta
                avatar={<Avatar src={profile['vcard:photo']} icon={<UserOutlined />} size="small" />}
                title={<Text>{profile['vcard:given-name']}</Text>}
              />
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>Voir</div>
                  <Switch checked={state.canView || state.canShare} disabled={state.viewReadonly} onChange={() => changeCanView(webId)} />
                </div>
                {isCreator && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>Partager</div>
                    <Switch checked={state.canShare} disabled={state.shareReadonly} onChange={() => changeCanShare(webId)} />
                  </div>
                )}
              </div>
            </List.Item>
          );
        }}
      />
      {!query.isLoading && contacts.length === 0 && (
        <Alert
          type="warning"
          showIcon
          message="Aucun contact pour le moment. Ajoutez des voisins à votre réseau depuis votre Pod pour pouvoir leur partager des petites annonces."
        />
      )}
    </div>
  );
};

export default RecipientPicker;
