import { useMemo, useState } from 'react';
import { useGetIdentity, useList, useTranslate } from '@refinedev/core';
import { Alert, Avatar, Input, List, Switch, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

import type { Identity, InvitationState, ProfileRecord } from '../types';
import { distanceKm, geoPoint, type GeoPoint } from '../utils/geo';

const { Text } = Typography;

type Props = {
  invitations: Record<string, InvitationState>;
  organizerUri: string;
  /** Whether the current user may grant "can re-share" rights — only the ad's own creator can. */
  isCreator: boolean;
  /** The ad's location and sharing radius, when it's geolocated. Contacts whose (approximate)
   *  home position is known and lies beyond `radiusKm` are left out of the list; those whose
   *  position isn't known are kept — the radius just can't be applied to them. */
  place?: GeoPoint & { radiusKm?: number };
  onChange: (invitations: Record<string, InvitationState>) => void;
};

/** Recipient checklist for sharing an ad, over the `apods:contacts`-derived `profile` list (only
 *  people the app can already read a profile for — i.e. mutual contacts). Each contact gets a
 *  "Voir" toggle and, for the creator only, a "Partager" toggle granting re-share rights. */
const RecipientPicker = ({ invitations, organizerUri, isCreator, place, onChange }: Props) => {
  const translate = useTranslate();
  const { data: identity } = useGetIdentity<Identity>();
  const [search, setSearch] = useState('');

  const { result, query } = useList<ProfileRecord>({
    resource: 'profile',
    pagination: { mode: 'off' },
    sorters: [{ field: 'vcard:given-name', order: 'asc' }]
  });

  // Distance from the ad for each contact with a known position — computed client-side from the
  // profiles already fetched above, so it costs nothing extra. Contacts already granted access
  // (readonly toggles) stay listed even when out of range: hiding them wouldn't revoke anything.
  const { contacts, outOfRange } = useMemo(() => {
    const withDistance = result.data
      .filter(profile => profile.describes !== organizerUri && profile.describes !== identity?.id)
      .map(profile => {
        const position = geoPoint(profile['vcard:hasGeo']);
        const distance = place && position ? distanceKm(place, position) : undefined;
        return { profile, distance };
      });
    const inRange = ({ profile, distance }: (typeof withDistance)[number]) =>
      distance === undefined ||
      place?.radiusKm === undefined ||
      distance <= place.radiusKm ||
      !!invitations[profile.describes]?.viewReadonly;
    return {
      contacts: withDistance
        .filter(inRange)
        .filter(({ profile }) => (profile['vcard:given-name'] || '').toLowerCase().includes(search.toLowerCase())),
      outOfRange: withDistance.filter(c => !inRange(c)).length
    };
  }, [result, search, organizerUri, identity, place, invitations]);

  const changeCanView = (webId: string) => {
    const state = invitations[webId] ?? {
      canView: false,
      canShare: false,
      viewReadonly: false,
      shareReadonly: !isCreator
    };
    const canView = !state.canView;
    onChange({ ...invitations, [webId]: { ...state, canView, canShare: canView && state.canShare } });
  };

  const changeCanShare = (webId: string) => {
    const state = invitations[webId] ?? {
      canView: false,
      canShare: false,
      viewReadonly: false,
      shareReadonly: !isCreator
    };
    const canShare = !state.canShare;
    onChange({ ...invitations, [webId]: { ...state, canShare, canView: canShare || state.canView } });
  };

  return (
    <div>
      <Input.Search
        placeholder={translate('recipients.search')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />
      <List
        loading={query.isLoading}
        dataSource={contacts}
        locale={{ emptyText: ' ' }}
        renderItem={({ profile, distance }) => {
          const webId = profile.describes;
          const state: InvitationState = invitations[webId] ?? {
            canView: false,
            canShare: false,
            viewReadonly: false,
            shareReadonly: !isCreator
          };
          return (
            <List.Item style={{ paddingLeft: 0, paddingRight: 0, gap: 12, flexWrap: 'wrap' }}>
              <List.Item.Meta
                avatar={<Avatar src={profile['vcard:photo']} icon={<UserOutlined />} size="small" />}
                title={
                  <Text>
                    {profile['vcard:given-name']}
                    {distance !== undefined && (
                      <Text type="secondary" style={{ marginLeft: 8, fontWeight: 'normal' }}>
                        {distance < 1 ? '< 1 km' : `${Math.round(distance)} km`}
                      </Text>
                    )}
                  </Text>
                }
              />
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{translate('recipients.view')}</div>
                  <Switch
                    checked={state.canView || state.canShare}
                    disabled={state.viewReadonly}
                    onChange={() => changeCanView(webId)}
                  />
                </div>
                {isCreator && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{translate('recipients.share')}</div>
                    <Switch
                      checked={state.canShare}
                      disabled={state.shareReadonly}
                      onChange={() => changeCanShare(webId)}
                    />
                  </div>
                )}
              </div>
            </List.Item>
          );
        }}
      />
      {outOfRange > 0 && (
        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
          {translate('recipients.out_of_range', { count: outOfRange, radius: place?.radiusKm })}
        </Text>
      )}
      {!query.isLoading && contacts.length === 0 && (
        <Alert
          type="warning"
          showIcon
          message={
            outOfRange > 0
              ? translate('recipients.none_in_range', { radius: place?.radiusKm })
              : translate('recipients.none')
          }
        />
      )}
    </div>
  );
};

export default RecipientPicker;
