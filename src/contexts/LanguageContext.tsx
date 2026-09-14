import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Language, translations } from '@/lib/translations';
import { getStorageItem, setStorageItem } from '@/lib/storage';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, arg2?: string | Record<string, string | number>, arg3?: string | Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANG_KEY = 'beautyflow_language';
const MANUAL_KEY = 'beautyflow_language_manual';

export const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined' || !navigator) return 'fr';
  
  // Check navigator.languages list first (user preference order), then navigator.language
  const languages = navigator.languages && navigator.languages.length > 0
    ? Array.from(navigator.languages)
    : [navigator.language || (navigator as any).userLanguage || ''];

  for (const lang of languages) {
    const l = (lang || '').toLowerCase().trim();
    if (l.startsWith('en')) return 'en';
    if (l.startsWith('fr')) return 'fr';
  }

  return 'fr';
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>(() => {
    // 1. Check URL query parameter (?lang=en or ?lang=fr)
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang === 'en' || urlLang === 'fr') {
          setStorageItem(LANG_KEY, urlLang as Language);
          localStorage.setItem(MANUAL_KEY, 'true');
          return urlLang as Language;
        }
      } catch {}
    }

    // 2. Check stored language if user explicitly chose it
    const isManual = typeof window !== 'undefined' && localStorage.getItem(MANUAL_KEY) === 'true';
    const saved = getStorageItem<Language | null>(LANG_KEY, null);
    if (isManual && saved && (saved === 'fr' || saved === 'en')) {
      return saved;
    }

    // 3. Automatically detect browser language
    const detected = detectBrowserLanguage();
    setStorageItem(LANG_KEY, detected);
    return detected;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Listen to browser language changes if not overridden manually
  useEffect(() => {
    const handleBrowserLanguageChange = () => {
      const isManual = localStorage.getItem(MANUAL_KEY) === 'true';
      if (!isManual) {
        const detected = detectBrowserLanguage();
        setLangState(detected);
        setStorageItem(LANG_KEY, detected);
      }
    };

    window.addEventListener('languagechange', handleBrowserLanguageChange);
    return () => window.removeEventListener('languagechange', handleBrowserLanguageChange);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    setStorageItem(LANG_KEY, lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(MANUAL_KEY, 'true');
    }
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

    let text = translations[language]?.[key] || translations['fr']?.[key] || fallback || key;
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
