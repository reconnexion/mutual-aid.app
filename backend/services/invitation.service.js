const { ACTIVITY_TYPES } = require('@semapps/activitypub');
const { PodActivitiesHandlerMixin } = require('@activitypods/app');
const { arrayOf } = require('@semapps/ldp');

/**
 * Sends a push notification when an offer/request/announcement is shared (`Announce`). Visibility
 * itself (ACL grant + attaching the resource to the recipient's own container) is already handled
 * elsewhere — this only adds the friendly notification. Comments (`Create{Note, inReplyTo}`) are
 * notified by the creator's Pod, like any direct message — see `useComments`.
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
                en: `{{{emitterProfile.vcard:given-name}}} shared an offer with you`,
                fr: `{{{emitterProfile.vcard:given-name}}} vous a partagé une offre`
              },
              actions: [
                {
                  caption: { en: 'View', fr: 'Voir' },
                  link: '/annonces/offer/{{encodeUri activity.object.id}}'
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
                en: `{{{emitterProfile.vcard:given-name}}} shared a request with you`,
                fr: `{{{emitterProfile.vcard:given-name}}} vous a partagé une demande`
              },
              actions: [
                {
                  caption: { en: 'View', fr: 'Voir' },
                  link: '/annonces/request/{{encodeUri activity.object.id}}'
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
    shareAnnouncement: {
      match: {
        type: ACTIVITY_TYPES.ANNOUNCE,
        object: {
          type: 'maid:Announcement'
        }
      },
      async onEmit(ctx, activity, emitterUri) {
        if (emitterUri !== activity.object['dc:creator']) {
          throw new Error('Only the creator has the right to share the announcement ' + activity.object.id);
        }

        for (const recipientUri of arrayOf(activity.target)) {
          await ctx.call('pod-notifications.send', {
            template: {
              title: {
                en: `{{{emitterProfile.vcard:given-name}}} shared an announcement with you`,
                fr: `{{{emitterProfile.vcard:given-name}}} vous a partagé une annonce`
              },
              actions: [
                {
                  caption: { en: 'View', fr: 'Voir' },
                  link: '/annonces/announcement/{{encodeUri activity.object.id}}'
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
