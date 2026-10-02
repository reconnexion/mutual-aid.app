import type { ReactNode } from 'react';
import { HeartOutlined, NotificationOutlined, SearchOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';

import type { FilterId } from './filters';
import type { AnnonceKind } from '../types';

/** Shared by the composer's "Je souhaite…" cards and the sidebar's group rows, so both read alike. */
export const KIND_ICON: Record<AnnonceKind, ReactNode> = {
  offer: <HeartOutlined />,
  request: <SearchOutlined />,
  announcement: <NotificationOutlined />
};

/** Sidebar rows with an icon: the two top rows and the group headers (sub-rows have none). */
export const FILTER_ICON: Partial<Record<FilterId, ReactNode>> = {
  all: <UnorderedListOutlined />,
  mine: <UserOutlined />,
  ...KIND_ICON
};
