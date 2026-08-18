const urlJoin = require('url-join');
const { AppService } = require('@activitypods/app');
const CONFIG = require('../config/config');

module.exports = {
  mixins: [AppService],
  settings: {
    baseUrl: CONFIG.HOME_URL,
    app: {
      name: CONFIG.APP_NAME,
      description: CONFIG.APP_DESCRIPTION,
      thumbnail: urlJoin(CONFIG.FRONT_URL, 'logo192.png'),
      frontUrl: CONFIG.FRONT_URL,
      supportedLocales: CONFIG.APP_LANG
    },
    oidc: {
      clientUri: CONFIG.FRONT_URL,
      redirectUris: urlJoin(CONFIG.FRONT_URL, 'login'),
      postLogoutRedirectUris: urlJoin(CONFIG.FRONT_URL, 'login?logout=true'),
      tosUri: null
    },
    accessNeeds: {
      required: [
        {
          // Already defined on the shared shape repository — we reuse the type, but populate our
          // own (simpler) set of properties on it (as:location, maid:expirationDate...). SHACL
          // shapes aren't enforced at write time, so this is safe.
          shapeTreeUri: urlJoin(CONFIG.SHAPE_REPOSITORY_URL, 'shapetrees/maid/Offer'),
          accessMode: ['acl:Read', 'acl:Write', 'acl:Control']
        },
        {
          shapeTreeUri: urlJoin(CONFIG.SHAPE_REPOSITORY_URL, 'shapetrees/maid/Request'),
          accessMode: ['acl:Read', 'acl:Write', 'acl:Control']
        },
        {
          // Read-only: used to display the author's name/avatar on ads and comments.
          shapeTreeUri: urlJoin(CONFIG.SHAPE_REPOSITORY_URL, 'shapetrees/as/Profile'),
          accessMode: 'acl:Read'
        },
        {
          // For the (optional) image attached to an ad.
          shapeTreeUri: urlJoin(CONFIG.SHAPE_REPOSITORY_URL, 'shapetrees/File'),
          accessMode: ['acl:Read', 'acl:Write']
        },
        {
          // Comments are posted as a `Create{Note, inReplyTo}` activity — the Pod checks the
          // activity's object type against the app's granted shape trees, so `as:Note` needs its
          // own access need even though comments aren't stored in a dedicated container.
          shapeTreeUri: urlJoin(CONFIG.SHAPE_REPOSITORY_URL, 'shapetrees/as/Note'),
          accessMode: ['acl:Read', 'acl:Write']
        },
        // Required for outbox-posting (sharing, commenting, liking, contact requests) to be
        // allowed at all — without these the Pod returns 403 "no permission to post to the
        // outbox (apods:PostOutbox)", confirmed against a live Pod provider.
        'apods:ReadInbox',
        'apods:ReadOutbox',
        'apods:PostOutbox'
      ],
      optional: []
    },
    queueServiceUrl: CONFIG.QUEUE_SERVICE_URL
  }
};
