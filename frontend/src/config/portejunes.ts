import { PORTEJUNES_URL } from './env';

// Deep-link handoff to PorteJunes (see its README / PayerPage.tsx) for the "Envoyer des Ğ1"
// button on an ad poster's profile -- this app doesn't implement Ğ1 payments itself, and
// deliberately so: the actual spend only ever happens through PorteJunes' own "Envoyer" button,
// signed client-side there (see pay-activity.service.js in that app for why). Handing off with the
// recipient preselected via `?to=` just saves the user from having to look them up again.
// Copied from La Carte des Savoirs' config/portejunes.ts.

/** Undefined when PorteJunes isn't configured on this deployment -- callers should hide the
 *  button entirely rather than link to a URL that doesn't exist. */
export const portejunesPayUrl = (recipientWebId: string): string | undefined => {
  if (!PORTEJUNES_URL) return undefined;
  const params = new URLSearchParams({ to: recipientWebId });
  return `${PORTEJUNES_URL.replace(/\/$/, '')}/?${params.toString()}`;
};
