const { ACTIVITY_TYPES } = require('@semapps/activitypub');
const { PodActivitiesHandlerMixin } = require('@activitypods/app');
const { arrayOf } = require('@semapps/ldp');

/**
 * Sends a push notification when an offer or request is shared (`Announce`) with the user.
 * Visibility itself (ACL grant + attaching the resource to the recipient's own container) is
 * already handled generically by the Pod provider's `announcer` service — this only adds the
 * friendly notification, matching the old app's `invitation.service.js`.
 */
module.exports = {
  name: 'invitation',
  mixins: [PodActivitiesHandlerMixin],
  activities: {
    shareOffer: {
      match: {
        type: ACTIVITY_TYPES.ANNOUNCE,
        object: {
          type: 'maid:Offer'
        }
      },
      async onEmit(ctx, activity, emitterUri) {
        if (emitterUri !== activity.object['dc:creator']) {
          throw new Error('Only the creator has the right to share the offer ' + activity.object.id);
        }

        for (const recipientUri of arrayOf(activity.target)) {
          await ctx.call('pod-notifications.send', {
            template: {
              title: {
                en: `{{emitterProfile.vcard:given-name}} shared an offer with you`,
                fr: `{{emitterProfile.vcard:given-name}} vous a partagé une offre`
              },
              actions: [
                {
                  caption: { en: 'View', fr: 'Voir' },
                  link: '/annonces/{{encodeUri activity.object.id}}'
                }
              ]
            },
            activity,
            context: activity.object.id,
            recipientUri
          });
        }
      }
    },
    shareRequest: {
      match: {
        type: ACTIVITY_TYPES.ANNOUNCE,
        object: {
          type: 'maid:Request'
        }
      },
      async onEmit(ctx, activity, emitterUri) {
        if (emitterUri !== activity.object['dc:creator']) {
          throw new Error('Only the creator has the right to share the request ' + activity.object.id);
        }

        for (const recipientUri of arrayOf(activity.target)) {
          await ctx.call('pod-notifications.send', {
            template: {
              title: {
                en: `{{emitterProfile.vcard:given-name}} shared a request with you`,
                fr: `{{emitterProfile.vcard:given-name}} vous a partagé une demande`
              },
              actions: [
                {
                  caption: { en: 'View', fr: 'Voir' },
                  link: '/annonces/{{encodeUri activity.object.id}}'
                }
              ]
            },
            activity,
            context: activity.object.id,
            recipientUri
          });
        }
      }
    }
  }
};
