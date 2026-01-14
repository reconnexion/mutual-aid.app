const { ACTIVITY_TYPES } = require('@semapps/activitypub');
const { PodActivitiesHandlerMixin } = require('@activitypods/app');
const { arrayOf } = require('@semapps/ldp');

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
      async onEmit(ctx, activity) {
        // We send the notification directly to the recipients, in case they haven't installed the app yet
        for (const recipientUri of arrayOf(activity.to)) {
          await ctx.call('pod-notifications.send', {
            template: {
              title: {
                en: `{{emitterProfile.vcard:given-name}} shared with you an offer "{{activity.object.pair:label}}"`,
                fr: `{{emitterProfile.vcard:given-name}} vous a partagé une offre "{{activity.object.pair:label}}"`
              },
              actions: [
                {
                  caption: {
                    en: 'View',
                    fr: 'Voir'
                  },
                  link: '/offers/{{encodeUri activity.object.id}}/show'
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

        // We send the notification directly to the recipients, in case they haven't installed the app yet
        for (const recipientUri of arrayOf(activity.target)) {
          await ctx.call('pod-notifications.send', {
            template: {
              title: {
                en: `{{emitterProfile.vcard:given-name}} shared with you an request "{{activity.object.pair:label}}"`,
                fr: `{{emitterProfile.vcard:given-name}} vous a partagé une demande "{{activity.object.pair:label}}"`
              },
              actions: [
                {
                  caption: {
                    en: 'View',
                    fr: 'Voir'
                  },
                  link: '/offers/{{encodeUri activity.object.id}}/show'
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
