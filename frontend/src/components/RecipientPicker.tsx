import { useEffect, useMemo, useState, type UIEvent } from 'react';
import { useGetIdentity, useInfiniteList, useTranslate, type CrudFilters } from '@refinedev/core';
import { Alert, Avatar, Input, List, Spin, Switch, Typography } from 'antd';
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
   *  home position is known and lies beyond `radiusKm` are left out of the list (by the Pod); those
   *  whose position isn't known are kept — the radius just can't be applied to them. */
  place?: GeoPoint & { radiusKm?: number };
  onChange: (invitations: Record<string, InvitationState>) => void;
};

/** Recipient checklist for sharing an ad, over the `apods:contacts`-derived `profile` list (only
 *  people the app can already read a profile for — i.e. mutual contacts). Each contact gets a
 *  "Voir" toggle and, for the creator only, a "Partager" toggle granting re-share rights.
 *  Contacts are searched, filtered by distance and paged by the Pod, and loaded while scrolling. */
const RecipientPicker = ({ invitations, organizerUri, isCreator, place, onChange }: Props) => {
  const translate = useTranslate();
  const { data: identity } = useGetIdentity<Identity>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Don't query the Pod on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const radiusKm = place?.radiusKm;
  const filters: CrudFilters = [
    ...(debouncedSearch ? [{ field: 'vcard:given-name', operator: 'contains' as const, value: debouncedSearch }] : []),
    ...(place && radiusKm !== undefined
      ? [
          {
            field: 'near',
            operator: 'eq' as const,
            value: { latitude: place.latitude, longitude: place.longitude, radius: radiusKm }
          }
        ]
      : [])
  ];

  const { result, query } = useInfiniteList<ProfileRecord>({
    resource: 'profile',
    pagination: { pageSize: 20, mode: 'server' },
    sorters: [{ field: 'vcard:given-name', order: 'asc' }],
    filters
  });
  const { fetchNextPage, isFetchingNextPage } = query;

  // Distance from the ad for each contact with a known position, computed client-side from the
  // profiles already fetched, so it costs nothing extra.
  const contacts = useMemo(
    () =>
      (result.data?.pages ?? [])
        .flatMap(page => page.data)
        .filter(profile => profile.describes !== organizerUri && profile.describes !== identity?.id)
        .map(profile => {
          const position = geoPoint(profile['vcard:hasGeo']);
          const distance = place && position ? distanceKm(place, position) : undefined;
          return { profile, distance };
        }),
    [result.data, organizerUri, identity, place]
  );

  // Load the next page when the list is scrolled near its end
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 100 && result.hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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
      {/* Only the list scrolls, so the search field and the dialog's buttons stay in view
          even with hundreds of contacts. */}
      <div style={{ maxHeight: 'min(400px, 50vh)', overflowY: 'auto' }} onScroll={onScroll}>
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
        {isFetchingNextPage && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <Spin size="small" />
          </div>
        )}
      </div>
      {radiusKm !== undefined && (
        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
          {translate('recipients.radius_hint', { radius: radiusKm })}
        </Text>
      )}
      {!query.isLoading && contacts.length === 0 && (
        <Alert
          type="warning"
          showIcon
          message={
            debouncedSearch
              ? translate('recipients.no_match', { search: debouncedSearch })
              : radiusKm !== undefined
                ? translate('recipients.none_in_range', { radius: radiusKm })
                : translate('recipients.none')
          }
        />
      )}
    </div>
  );
};

export default RecipientPicker;
