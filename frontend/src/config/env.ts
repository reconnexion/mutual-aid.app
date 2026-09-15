/** Centralised, typed access to the app's Vite env vars (see `.env` / `.env.local`). */

export const APP_NAME = import.meta.env.VITE_APP_NAME as string;
export const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION as string;
export const APP_LANG = (import.meta.env.VITE_APP_LANG as string) || 'fr';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;
export const CLIENT_ID = import.meta.env.VITE_BACKEND_CLIENT_ID as string;

export const SHAPE_REPOSITORY_URL = import.meta.env.VITE_SHAPE_REPOSITORY_URL as string;

/** When set, the login page offers this single Pod provider instead of the public list. */
export const DEFAULT_POD_PROVIDER = import.meta.env.VITE_POD_PROVIDER_BASE_URL as string | undefined;

export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

/** PorteJunes' URL, for the "Envoyer des Ğ1" handoff button (see `config/portejunes.ts`).
 *  Unset hides the button. */
export const PORTEJUNES_URL = import.meta.env.VITE_PORTEJUNES_URL as string | undefined;

/** Where "Soutenir cette application" (bottom of the sidebar) sends people. Unset hides the link. */
export const DONATION_URL = import.meta.env.VITE_DONATION_URL as string | undefined;
