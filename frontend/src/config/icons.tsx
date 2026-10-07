import type { ReactNode } from 'react';
import {
  AppstoreOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  HeartOutlined,
  NotificationOutlined,
  SearchOutlined,
  ShoppingOutlined,
  SwapOutlined,
  TagOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  UserOutlined
} from '@ant-design/icons';

import type { FilterId } from './filters';
import type { AnnonceKind, ExchangeType, ResourceType } from '../types';

/** Shared by the composer's cards, the sidebar and the ad cards' tags, so all three read alike. */
export const KIND_ICON: Record<AnnonceKind, ReactNode> = {
  offer: <HeartOutlined />,
  request: <SearchOutlined />,
  announcement: <NotificationOutlined />
};

export const RESOURCE_TYPE_ICON: Record<ResourceType, ReactNode> = {
  'pair:AtomBasedResource': <ToolOutlined />,
  'pair:HumanBasedResource': <BulbOutlined />,
  'pair:Resource': <AppstoreOutlined />
};

export const EXCHANGE_ICON: Record<ExchangeType, ReactNode> = {
  'maid:GiftOffer': <GiftOutlined />,
  'maid:BarterOffer': <SwapOutlined />,
  // A price tag rather than a currency sign: sales can be paid in euros or in Ğ1.
  'maid:SaleOffer': <TagOutlined />,
  'maid:LoanOffer': <ClockCircleOutlined />,
  'maid:GiftRequest': <GiftOutlined />,
  'maid:BarterRequest': <SwapOutlined />,
  'maid:PurchaseRequest': <ShoppingOutlined />,
  'maid:LoanRequest': <ClockCircleOutlined />
};

/** Sidebar rows with an icon: the two top rows and the group headers (sub-rows have none). */
export const FILTER_ICON: Partial<Record<FilterId, ReactNode>> = {
  all: <UnorderedListOutlined />,
  mine: <UserOutlined />,
  ...KIND_ICON
};
