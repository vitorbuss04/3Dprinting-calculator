import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptTranslation from './locales/pt.json';
import enTranslation from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        translation: ptTranslation,
      },
      en: {
        translation: enTranslation,
      },
    },
    lng: 'pt', // Portuguese default
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
