import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RendezVous } from '@/types/rendez-vous';
import { Client, TypePrestation } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface TodayAppointmentsProps {
  rendezVous: RendezVous[];
  clients: Client[];
  typesPrestations: TypePrestation[];
}

const statutColors: Record<string, string> = {
  confirme: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold',
  en_attente: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold',
  annule: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold',
  termine: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold',
};

export function TodayAppointments({ rendezVous, clients, typesPrestations }: TodayAppointmentsProps) {
  const { t } = useLanguage();

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'confirme':
        return t('todayRdv.statusConfirme') || 'Confirmé';
      case 'en_attente':
        return t('todayRdv.statusEnAttente') || 'En attente';
      case 'annule':
        return t('todayRdv.statusAnnule') || 'Annulé';
      case 'termine':
        return t('todayRdv.statusTermine') || 'Terminé';
      default:
        return statut;
    }
  };

  const openWhatsApp = (phone?: string, name?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('237') ? cleanPhone : `237${cleanPhone}`;
    const text = encodeURIComponent(`Bonjour ${name || ''}, nous vous rappelons votre rendez-vous aujourd'hui au salon !`);
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900 transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
        <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
          <Calendar className="h-4.5 w-4.5 text-rose-500" />
          <span>{t('todayRdv.title') || "Rendez-vous du jour"}</span>
          {rendezVous.length > 0 && (
            <Badge variant="outline" className="text-[11px] font-bold text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 px-2 py-0.5">
              {rendezVous.length}
            </Badge>
          )}
        </CardTitle>
        <Link to="/rendez-vous">
          <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 px-2">
            <span>{t('todayRdv.viewAll') || "Planning complet"}</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 pb-4">
        {rendezVous.length > 0 ? (
          <div className="space-y-2.5">
            {rendezVous.slice(0, 5).map(rdv => {
              const client = clients.find(c => c.id === rdv.clientId);
              const type = typesPrestations.find(t => t.id === rdv.typePrestationId);
              return (
                <div key={rdv.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700 transition-all">
                  
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex flex-col items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg px-2.5 py-1 shrink-0 border border-rose-500/20 font-extrabold">
                      <Clock className="h-3.5 w-3.5 mb-0.5" />
                      <span className="text-[11px] font-extrabold">{rdv.heure}</span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p className="font-black text-sm text-slate-950 dark:text-white truncate">
                        {client?.nom || rdv.customerName || 'Client inconnu'}
                      </p>
                      
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate flex items-center gap-2 font-bold">
                        <span>{type?.nom || 'Prestation'}</span>
                        {rdv.employe && (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                              {typeof rdv.employe === 'object' ? (rdv.employe as any).name : rdv.employe}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {(client?.telephone || rdv.customerPhone) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openWhatsApp(client?.telephone || rdv.customerPhone, client?.nom || rdv.customerName)}
                        className="h-9 w-9 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 rounded-xl border border-emerald-500/20 shadow-xs"
                        title="Envoyer un rappel WhatsApp"
                      >
                        <MessageCircle className="h-4.5 w-4.5" />
                      </Button>
                    )}

                    <Badge variant="outline" className={`text-xs px-2.5 py-1 ${statutColors[rdv.statut] || 'bg-slate-100 text-slate-700'}`}>
                      {getStatutLabel(rdv.statut)}
                    </Badge>
                  </div>

                </div>
              );
            })}

            {rendezVous.length > 5 && (
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center font-bold pt-1">
                {(t('todayRdv.othersCount') || '+{count} autres').replace('{count}', (rendezVous.length - 5).toString())}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <Calendar className="h-14 w-14 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-300 text-sm font-extrabold">
              {t('todayRdv.noRdv') || "Aucun rendez-vous aujourd'hui"}
            </p>
            <Link to="/rendez-vous">
              <Button variant="link" size="sm" className="mt-2 text-xs font-black text-rose-600 dark:text-rose-400">
                {t('todayRdv.scheduleOne') || "Planifier un RDV"}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
