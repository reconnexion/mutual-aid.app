import urlJoin from './urlJoin';
import type { AnnonceRecord } from '../types';

/**
 * URI of an ad's `as:replies` / `as:likes` collection. The Pod creates it at `<ad>/replies` or
 * `<ad>/likes` on the first comment or like (SemApps' `collections-registry`), and links it from
 * the ad — but without sending an `Update`, so the copy kept by the people the ad was shared with
 * (what their container, hence the feed, returns) never gets the link. So the URI is derived
 * rather than read; until the collection exists, fetching it 404s and `useActivityCollection`
 * treats that as empty.
 */
export const collectionUriOf = (annonce: AnnonceRecord, collection: 'replies' | 'likes'): string | undefined =>
  annonce[collection] ?? (annonce.id ? urlJoin(annonce.id, collection) : undefined);
