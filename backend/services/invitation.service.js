const { ACTIVITY_TYPES } = require('@semapps/activitypub');
const { PodActivitiesHandlerMixin } = require('@activitypods/app');
const { arrayOf } = require('@semapps/ldp');

/**
 * Sends a push notification when an offer/request/announcement is shared (`Announce`). Visibility
 * itself (ACL grant + attaching the resource to the recipient's own container) is already handled
 * elsewhere — this only adds the friendly notification. Comments (`Create{Note, inReplyTo}`) are
 * notified by the creator's Pod, like any direct message — see `useComments`.
 */

const TITLES = {
  offer: {
    en: `{{{emitterProfile.vcard:given-name}}} shared an offer with you`,
    fr: `{{{emitterProfile.vcard:given-name}}} vous a partagé une offre`
  },
  request: {
    en: `{{{emitterProfile.vcard:given-name}}} shared a request with you`,
    fr: `{{{emitterProfile.vcard:given-name}}} vous a partagé une demande`
  },
  announcement: {
    en: `{{{emitterProfile.vcard:given-name}}} shared an announcement with you`,
    fr: `{{{emitterProfile.vcard:given-name}}} vous a partagé une annonce`
  }
};

const shareHandler = (type, kind) => ({
  match: {
    type: ACTIVITY_TYPES.ANNOUNCE,
    object: { type }
  },
  async onEmit(ctx, activity) {
    // Delegates' Announces are checked by the Pod provider against apods:announcers
    for (const recipientUri of arrayOf(activity.to)) {
      try {
        await ctx.call('pod-notifications.send', {
          template: {
            title: TITLES[kind],
            actions: [
              {
                caption: { en: 'View', fr: 'Voir' },
                link: `/annonces/${kind}/{{encodeUri activity.object.id}}`
              }
            ]
          },
          activity,
          context: activity.object.id,
          recipientUri
        });
      } catch (e) {
        this.logger.warn(`Could not notify ${recipientUri} of ${activity.id}: ${e.message}`);
      }
    }
  }
});

module.exports = {
  name: 'invitation',
  mixins: [PodActivitiesHandlerMixin],
  activities: {
    shareOffer: shareHandler('maid:Offer', 'offer'),
    shareRequest: shareHandler('maid:Request', 'request'),
    shareAnnouncement: shareHandler('maid:Announcement', 'announcement')
  }
};
