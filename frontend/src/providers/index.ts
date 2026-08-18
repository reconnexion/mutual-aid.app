import { authProvider as apAuthProvider, dataProvider as apDataProvider } from '@activitypods/refine-providers';
import urlJoin from '../utils/urlJoin';
import { BACKEND_URL, CLIENT_ID, SHAPE_REPOSITORY_URL } from '../config/env';

export const authProvider = apAuthProvider({
  clientId: CLIENT_ID
});

/** Merges in the backend's own JSON-LD context, which types `maid:offerOfResourceType` /
 *  `maid:requestOfResourceType` as `@type: "@id"` and `maid:expirationDate` as `xsd:dateTime`
 *  (see backend's `services/core/core.service.js`). Without it, those fields would be submitted
 *  as plain string literals instead of typed values. */
const JSON_CONTEXT = ['https://www.w3.org/ns/activitystreams', urlJoin(new URL(BACKEND_URL).origin, '.well-known/context.jsonld')];

/** Resources living on the logged-in user's own Pod. `offer`/`request` are already defined on
 *  the shared shape repository — we reuse the type, but populate our own simpler set of
 *  properties on them (see `types.ts`). Ads shared with the user land here automatically: the
 *  Pod provider's `announcer` service attaches an `Announce`d resource straight into the
 *  recipient's own `offer`/`request` container, so a plain `getList` picks it up. */
export const dataProvider = apDataProvider({
  authProvider,
  jsonContext: JSON_CONTEXT,
  resources: {
    offer: {
      shapeTreeUri: urlJoin(SHAPE_REPOSITORY_URL, 'shapetrees/maid/Offer')
    },
    request: {
      shapeTreeUri: urlJoin(SHAPE_REPOSITORY_URL, 'shapetrees/maid/Request')
    },
    profile: {
      shapeTreeUri: urlJoin(SHAPE_REPOSITORY_URL, 'shapetrees/as/Profile')
    },
    location: {
      shapeTreeUri: urlJoin(SHAPE_REPOSITORY_URL, 'shapetrees/vcard/Location')
    }
  }
});
