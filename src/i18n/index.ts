/**
 * i18n Bootstrap
 * ──────────────
 * Initializes i18next with EN (default), TR, and DE translations.
 * Language switches globally via i18n.changeLanguage(code).
 * PreferencesContext calls this automatically when the user changes language
 * in Settings, or immediately after login when saved preferences are loaded.
 *
 * IMPORTANT: i18n.init() is async. This module exports both the i18n instance
 * AND an `i18nReady` promise so that main.tsx can await readiness before render.
 *
 * Usage in any component:
 *   import { useTranslation } from 'react-i18next';
 *   const { t } = useTranslation();
 *   t('dashboard.title')   // → "Dashboard" | "Panel" | "Übersicht"
 *   t('nav.expenses')      // → "Expenses"  | "Harcamalar" | "Ausgaben"
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';
import de from './locales/de.json';

export const i18nReady = i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      de: { translation: de },
    },
    lng:          'en',    // default; overridden by PreferencesContext after login
    fallbackLng:  'en',    // any missing key falls back to English silently
    interpolation: {
      escapeValue: false,  // React already XSS-escapes rendered values
    },
    saveMissing:  false,   // suppress console warnings for untranslated keys in dev
    react: {
      useSuspense: false,  // disable Suspense — we handle loading state ourselves
    },
  });

export default i18n;
