import React from 'react';
import { CalendrierRendezVous } from '@/components/prestations/CalendrierRendezVous';
import { useLanguage } from '@/contexts/LanguageContext';
import { PendingPublicBookings } from '@/components/booking/PendingPublicBookings';

export default function RendezVousPage() {
  const { t } = useLanguage();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('appointments.title')}</h1>
        <p className="text-muted-foreground">{t('appointments.subtitle')}</p>
      </div>
      <PendingPublicBookings />
      <CalendrierRendezVous />
    </div>
  );
}
