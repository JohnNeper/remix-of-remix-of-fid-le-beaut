import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function useTranslations() {
  const { language, setLanguage, t } = useLanguage();

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-CM' : 'en-CM', { 
      style: 'decimal', 
      minimumFractionDigits: 0 
    }).format(amount) + ' FCFA';
  }, [language]);

  const formatDate = useCallback((date: string | Date | number, options?: Intl.DateTimeFormatOptions) => {
    if (!date) return '';
    try {
      return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', options || {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date(date));
    } catch (e) {
      return String(date);
    }
  }, [language]);

  return {
    t,
    language,
    setLanguage,
    formatCurrency,
    formatDate
  };
}
