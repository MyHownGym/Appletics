import { createContext, useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { Language, TranslationKey } from '@/constants/i18n';
import { profileLabels } from '@/constants/profileLabels';
import { normalizeLanguage, translateUiText, localeFor } from '@/services/localizationService';
const languageKey = '@appletics_language';
interface I18nContextType { language: Language; locale: string; setLanguage: (language: Language) => void; t: (key: TranslationKey | string) => string }
export const I18nContext = createContext<I18nContextType | undefined>(undefined);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(languageKey).then(saved => {
      if (active) setLanguageState(normalizeLanguage(saved ?? getLocales()[0]?.languageCode));
    }).catch(() => { if (active) setLanguageState(normalizeLanguage(getLocales()[0]?.languageCode)); });
    return () => { active = false; };
  }, []);
  const setLanguage = useCallback((value: Language) => {
    const selected = normalizeLanguage(value);
    setLanguageState(selected);
    void AsyncStorage.setItem(languageKey, selected).catch(() => {});
  }, []);
  const t = useCallback((key: TranslationKey | string): string => (profileLabels[language] as Record<string, string>)[key] ?? translateUiText(key, language), [language]);
  const value = useMemo(() => ({ language, locale: localeFor(language), setLanguage, t }), [language, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
