/**
 * i18n Bootstrap
 * ──────────────
 * Initializes i18next with EN (default) and TR translations.
 * Language is switched globally by calling i18n.changeLanguage(code).
 * PreferencesContext calls this automatically when the user changes language in Settings.
 *
 * Usage in any component:
 *   import { useTranslation } from 'react-i18next';
 *   const { t } = useTranslation();
 *   t('dashboard.title')  // → "Dashboard" or "Panel" depending on language
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    lng: 'en',                   // default language
    fallbackLng: 'en',           // fallback if a key is missing in the selected language
    interpolation: {
      escapeValue: false,        // React already escapes values
    },
    // Disable warnings for missing keys in DEV — they're expected while translations are in-progress
    missingKeyHandler: false,
  });

export default i18n;
