/* eslint-disable react/only-export-components -- i18n module: provider component + hook + constants */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './en';
import { am } from './am';

/** Supported languages (Amharic is LTR despite the Ethiopic script). */
export const LANGUAGES = {
  en: { label: 'English', short: 'EN', dir: 'ltr' },
  am: { label: 'አማርኛ', short: 'አማ', dir: 'ltr' },
};

const STORAGE_KEY = 'appworks_lang';
const DEFAULT_LANGUAGE = 'en';

const MESSAGES = { en, am };

const I18nContext = createContext(undefined);

/** Restore the saved language, falling back to English. */
function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && MESSAGES[stored]) return stored;
  } catch {
    // Storage unavailable — fall through to the default.
  }
  return DEFAULT_LANGUAGE;
}

/**
 * I18nProvider — lightweight English/Amharic localization.
 *
 * - `t(key)` looks the key up in the active locale and falls back to English.
 * - The choice persists in localStorage (`appworks_lang`) so refreshes keep it.
 * - `document.documentElement.lang` stays in sync for screen readers.
 * - Both languages are LTR, so no direction switching is needed.
 */
export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    if (!MESSAGES[nextLanguage]) return;
    setLanguageState(nextLanguage);
    try {
      localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // Non-persistent sessions still get the in-memory switch.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key) => MESSAGES[language]?.[key] ?? MESSAGES.en[key] ?? key,
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Access the active language and translation function.
 * Must be used inside <I18nProvider>.
 * @returns {{ language: string, setLanguage: Function, t: Function, languages: object }}
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an <I18nProvider>.');
  }
  return context;
}
