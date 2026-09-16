import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { I18nProvider } from '@refinedev/core';

import { APP_LANG } from '../config/env';
import en from './locales/en.json';
import fr from './locales/fr.json';

i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: APP_LANG,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

/**
 * Language is fixed per deployment (via VITE_APP_LANG, see `config/env.ts`) — there is no
 * in-app language switcher, same as welcometomyplace. `changeLocale` is still wired up (it's
 * part of Refine's `I18nProvider` contract) but nothing in this app calls it today.
 */
export const i18nProvider: I18nProvider = {
  // Refine calls `translate(key, options, defaultMessage)` for its own built-in strings (and so
  // does `AntdAuthPage`) — forwarding the third argument as i18next's `defaultValue` means a key
  // we haven't translated falls back to that English default rather than rendering the raw key.
  translate: (key: string, options?: any, defaultMessage?: string) =>
    i18next.t(key, { ...options, defaultValue: defaultMessage }) as string,
  changeLocale: (lang: string) => i18next.changeLanguage(lang),
  getLocale: () => i18next.language
};

export default i18next;
