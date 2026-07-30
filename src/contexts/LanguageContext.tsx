import React, { createContext, useContext, useState, useCallback } from 'react';
import { Language, translations } from '@/lib/translations';
import { getStorageItem, setStorageItem } from '@/lib/storage';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, arg2?: string | Record<string, string | number>, arg3?: string | Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANG_KEY = 'beautyflow_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>(
    () => getStorageItem<Language>(LANG_KEY, 'fr')
  );

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    setStorageItem(LANG_KEY, lang);
  }, []);

  const t = useCallback((key: string, arg2?: string | Record<string, string | number>, arg3?: string | Record<string, string | number>): string => {
    let fallback: string | undefined;
    let params: Record<string, string | number> | undefined;

    if (typeof arg2 === 'string') {
      fallback = arg2;
      if (typeof arg3 === 'object') params = arg3;
    } else if (typeof arg2 === 'object') {
      params = arg2;
      if (typeof arg3 === 'string') fallback = arg3;
    }

    let text = translations[language][key] || translations['fr'][key] || fallback || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
