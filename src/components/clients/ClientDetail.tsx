import React, { useState } from 'react';
import {
  Phone, Calendar, Star, Gift, TrendingUp, MessageSquare,
  Clock, Award, Sparkles, User, StickyNote, ChevronRight,
  Wallet, Activity, Tag, Users, CheckCircle2, HeartHandshake,
} from 'lucide-react';
import { Client } from '@/types';
import { usePrestations } from '@/hooks/usePrestations';
import { useSalon } from '@/hooks/useSalon';
import { useClients } from '@/hooks/useClients';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useAuth } from '@/contexts/AuthContext';

interface ClientDetailProps {
  client: Client;
}

type Tab = 'info' | 'historique';

export function ClientDetail({ client }: ClientDetailProps) {
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useTranslations();
  const { getPrestationsClient, getTypePrestation } = usePrestations();
  const { clients } = useClients();
  const { salon } = useSalon();
  const { session } = useAuth();
  const isOwner = session?.userRole === 'owner' || session?.type === 'admin';
  const prestations = getPrestationsClient(client.id);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const statusConfig = {
    nouvelle: { label: `✨ ${t('clients.nouvelle') || 'Nouvelle'}`, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
    reguliere: { label: `🌿 ${t('clients.reguliere') || 'Régulière'}`, color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    vip: { label: `👑 ${t('clients.vip') || 'VIP'} ✦`, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  };

  const visitesRequises = salon?.configFidelite?.visitesRequises || 10;
  const progressFidelite = Math.min(
    ((client.pointsFidelite || 0) % visitesRequises) / visitesRequises * 100,
    100
  );
  const reductionsGagnees = Math.floor((client.pointsFidelite || 0) / visitesRequises);
  const visitesPourProchain = visitesRequises - ((client.pointsFidelite || 0) % visitesRequises);
  const statusCfg = statusConfig[client.statut] || statusConfig['nouvelle'];

  // Calculate real total spent from prestations if greater than client.totalDepense
  const totalSpentFromPrestations = prestations.reduce((sum, p) => sum + (p.montant || 0), 0);
  const realTotalSpent = Math.max(client.totalDepense || 0, totalSpentFromPrestations);

  // Parrain (Referrer) info
  const parrain = client.parrainId ? clients.find(c => c.id === client.parrainId) : null;

  // Filleuls (Referred clients) list
  const filleulsList = client.filleuls && client.filleuls.length > 0
    ? clients.filter(c => client.filleuls?.includes(c.id))
    : [];

  // Prestation la plus récente
  const lastPrestation = prestations.length > 0
    ? [...prestations].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const realLastVisit = client.derniereVisite || lastPrestation?.date || null;

  const handleWhatsApp = () => {
    const cleanPhone = client.telephone.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('237') ? cleanPhone : `237${cleanPhone}`;
    const defaultMsg = `Bonjour ${client.nom}, nous espérons que vous allez bien ! Nous serions ravis de vous revoir bientôt au salon. 💇‍♀️✨`;
    const message = encodeURIComponent(
      (t('clients.whatsappMessage') || defaultMsg).replace('{nom}', client.nom)
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.open(`tel:${client.telephone.replace(/\s/g, '')}`, '_self');
  };

  return (
    <div className="flex flex-col w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-950 font-sans max-h-[85vh] sm:max-h-[90vh]">
      
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-700 to-purple-800 text-white px-4 sm:px-6 pt-5 pb-5 shrink-0">
        {/* Ambient Glow circles */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-rose-400/20 blur-xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-3">
          {/* Avatar + Name + Badges */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-md">
                <span className="text-white font-black text-xl sm:text-2xl tracking-tight select-none">
                  {client.nom.charAt(0).toUpperCase()}
                </span>
              </div>
              {client.statut === 'vip' && (
                <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center shadow-xs">
                  <Star className="h-3 w-3 text-slate-950 fill-slate-950" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight tracking-tight truncate">
                {client.nom}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5 text-white/80 text-xs font-semibold">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{client.telephone}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white backdrop-blur-md border border-white/20">
                  {statusCfg.label}
                </span>
                {client.groupe && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/20 text-white/90 backdrop-blur-md">
                    <Tag className="h-3 w-3" />
                    {client.groupe}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              onClick={handleCall}
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md rounded-xl h-9 w-9 p-0 sm:w-auto sm:px-3 gap-1.5 shadow-2xs"
              title={t('clients.callClient') || 'Appeler'}
            >
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-bold">{t('clients.callClient') || 'Appeler'}</span>
            </Button>

            <Button
              type="button"
              onClick={handleWhatsApp}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/40 rounded-xl h-9 px-3 gap-1.5 shadow-md shadow-emerald-950/20 text-xs font-bold"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          </div>
        </div>

        {/* Header Key Metrics Row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-white leading-none">{client.nombreVisites || 0}</p>
            <p className="text-[10px] sm:text-[11px] text-white/70 mt-1 font-bold uppercase tracking-wider">{t('clients.visits') || 'Visites'}</p>
          </div>

          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-white leading-none">{client.pointsFidelite || 0}</p>
            <p className="text-[10px] sm:text-[11px] text-white/70 mt-1 font-bold uppercase tracking-wider">{t('clients.points') || 'Points'}</p>
          </div>

          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-white leading-none">{reductionsGagnees}</p>
            <p className="text-[10px] sm:text-[11px] text-white/70 mt-1 font-bold uppercase tracking-wider">{t('clients.discounts') || 'Réductions'}</p>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation Bar ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {([
          { key: 'info', label: t('clients.profileTab') || 'Profil & Infos', icon: User },
          { key: 'historique', label: t('clients.historyTab') || 'Historique des soins', icon: Activity },
        ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-extrabold transition-all border-b-2',
              activeTab === key
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {key === 'historique' && prestations.length > 0 && (
              <span className={cn(
                'text-[10px] font-black px-2 py-0.5 rounded-full leading-none',
                activeTab === key ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}>
                {prestations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Scrollable Body ── */}
      <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">

        {/* ═══════════════ PROFIL TAB ═══════════════ */}
        {activeTab === 'info' && (
          <div className="space-y-4">

            {/* Dépenses & Bilan Financier (Owner & Admin only) */}
            {isOwner && (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider truncate">{t('clients.totalSpent') || 'Total dépensé'}</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{formatCurrency(realTotalSpent)}</p>
                  </div>
                </div>

                {lastPrestation && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('clients.lastPurchase') || 'Dernier soin'}</p>
                    <p className="text-xs font-black text-rose-600 dark:text-rose-400">{formatDate(lastPrestation.date)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Carte Progression Fidélité */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-rose-500" />
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">{t('clients.loyaltyProgress') || 'Progression fidélité'}</span>
                </div>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  {(client.pointsFidelite || 0) % visitesRequises} / {visitesRequises} {t('clients.visits')?.toLowerCase() || 'visites'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 bg-gradient-to-r from-rose-500 to-purple-600 shadow-xs"
                  style={{ width: `${progressFidelite}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <p>
                  {(t('clients.visitNeeded') || 'Encore {count} visite(s) pour obtenir {discount}% de réduction')
                    .replace('{count}', visitesPourProchain.toString())
                    .replace('{discount}', (salon?.configFidelite?.reductionPourcentage || 10).toString())}
                </p>
              </div>

              {reductionsGagnees > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <Award className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <p className="text-xs font-extrabold">
                    {(t('clients.discountsUnlocked') || '🎉 {count} réduction(s) disponible(s) !')
                      .replace('{count}', reductionsGagnees.toString())}
                  </p>
                </div>
              )}
            </div>

            {/* Carte Informations Personnelles & Réseau */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">{t('clients.info') || 'Informations'}</h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* Date inscription */}
                <div className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 text-slate-500 font-semibold">
                    <Calendar className="h-4 w-4 text-rose-500" />
                    <span>{t('clients.registeredOn') || "Inscrite le"}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{formatDate(client.dateInscription)}</span>
                </div>

                {/* Anniversaire */}
                {client.dateAnniversaire && (
                  <div className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 text-slate-500 font-semibold">
                      <Gift className="h-4 w-4 text-rose-500" />
                      <span>{t('clients.birthday') || "Anniversaire"}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">{formatDate(client.dateAnniversaire)}</span>
                  </div>
                )}

                {/* Dernière visite */}
                <div className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 text-slate-500 font-semibold">
                    <Clock className="h-4 w-4 text-rose-500" />
                    <span>{t('clients.lastVisit') || "Dernière visite"}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {realLastVisit
                      ? formatDate(realLastVisit)
                      : <span className="text-slate-400 font-normal italic text-xs">{t('clients.lastVisitNone') || 'Aucune'}</span>}
                  </span>
                </div>

                {/* Parrain / Marraine */}
                {parrain ? (
                  <div className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 text-slate-500 font-semibold">
                      <HeartHandshake className="h-4 w-4 text-rose-500" />
                      <span>{t('clients.referredByTitle') || 'Parrainée par'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-rose-600 dark:text-rose-400">{parrain.nom}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{parrain.telephone}</p>
                    </div>
                  </div>
                ) : client.parrainId ? (
                  <div className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 text-slate-500 font-semibold">
                      <HeartHandshake className="h-4 w-4 text-rose-500" />
                      <span>{t('clients.referredSponsored') || 'Parrainée'}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-extrabold">{t('clients.referredSponsored') || 'Parrainée'}</Badge>
                  </div>
                ) : null}

                {/* Filleuls list */}
                {filleulsList.length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2.5 text-slate-500 font-semibold">
                        <Users className="h-4 w-4 text-rose-500" />
                        <span>{t('clients.referredChildren') || 'Filleuls parrainés'}</span>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black">
                        ⭐ {(t('clients.referralsCount') || '{count} filleul(s)').replace('{count}', filleulsList.length.toString())} (+{filleulsList.length} pts)
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {filleulsList.map(f => (
                        <div key={f.id} className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>{f.nom}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes & Préférences de soin */}
            {client.notes && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-rose-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">{t('clients.notesTitle') || 'Notes & Préférences'}</h3>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ HISTORIQUE TAB ═══════════════ */}
        {activeTab === 'historique' && (
          <div className="space-y-3">
            {prestations.length > 0 ? (
              <>
                {/* Historique Summary Bar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-center shadow-2xs">
                    <p className="text-xl font-black text-slate-900 dark:text-white">{prestations.length}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{t('clients.totalServicesCount') || 'Prestations réalisées'}</p>
                  </div>

                  {isOwner && (
                    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-center shadow-2xs">
                      <p className="text-xl font-black text-rose-600 dark:text-rose-400 truncate">
                        {formatCurrency(prestations.reduce((s, p) => s + (p.montant || 0), 0))}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{t('clients.totalServicesSum') || 'Total prestations'}</p>
                    </div>
                  )}
                </div>

                {/* Prestations List */}
                <div className="space-y-2">
                  {[...prestations]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((prestation) => {
                      const type = getTypePrestation(prestation.typePrestationId);
                      return (
                        <div
                          key={prestation.id}
                          className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-500/30 transition-all shadow-2xs"
                        >
                          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {type?.nom || t('services.unknown') || 'Prestation'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-semibold">
                              <span>{formatDate(prestation.date)}</span>
                              {prestation.employe && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-700">•</span>
                                  <span className="truncate text-rose-600 dark:text-rose-400">
                                    {(t('clients.byStaff') || 'Coiffé(e) par {name}').replace('{name}', prestation.employe)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {isOwner && prestation.montant > 0 && (
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white shrink-0">
                              {formatCurrency(prestation.montant)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2.5 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <TrendingUp className="h-7 w-7 opacity-50" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                  {t('clients.noHistory') || 'Aucune prestation enregistrée'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
