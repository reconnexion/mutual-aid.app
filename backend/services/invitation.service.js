const { ACTIVITY_TYPES, OBJECT_TYPES } = require('@semapps/activitypub');
const { PodActivitiesHandlerMixin } = require('@activitypods/app');
const { arrayOf } = require('@semapps/ldp');

/**
 * Sends a push notification when an offer/request is shared (`Announce`), or replied to
 * (`Create{Note, inReplyTo}`). Visibility itself (ACL grant + attaching the resource to the
 * recipient's own container, or public read for comments — see `useComments`' `AS_PUBLIC`) is
 * already handled elsewhere — this only adds the friendly notification.
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
                en: `{{emitterProfile.vcard:given-name}} shared a request with you`,
                fr: `{{emitterProfile.vcard:given-name}} vous a partagé une demande`
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
    comment: {
      match: {
        type: ACTIVITY_TYPES.CREATE,
        object: {
          type: OBJECT_TYPES.NOTE
        }
      },
      // Fires on the ad creator's own Pod when they receive a comment in their inbox (comments
      // are addressed `to: [creator, AS_PUBLIC]` — see `useComments`), so `recipientUri` here is
      // always the ad's creator.
      async onReceive(ctx, activity, recipientUri) {
        const annonceUri = activity.object.inReplyTo;
        if (!annonceUri || activity.actor === recipientUri) return;

        const { ok, body: annonce } = await ctx.call('pod-resources.get', {
          resourceUri: annonceUri,
          actorUri: recipientUri
        });
        if (!ok) return;

        const kind = arrayOf(annonce.type).includes('maid:Request') ? 'request' : 'offer';
        const annonceTitle = annonce.name || '';

        await ctx.call('pod-notifications.send', {
          template: {
            title: {
              en: `{{emitterProfile.vcard:given-name}} replied to your ad {{annonceTitle}}`,
              fr: `{{emitterProfile.vcard:given-name}} a répondu à votre petite annonce {{annonceTitle}}`
            },
            content: '{{activity.object.summary}}',
            actions: [
              {
                caption: { en: 'View', fr: 'Voir' },
                link: `/annonces/${kind}/{{encodeUri annonceUri}}`
              }
            ]
          },
          activity,
          annonceUri,
          annonceTitle,
          context: annonceUri,
          recipientUri
        });
      }
    }
  }
};
