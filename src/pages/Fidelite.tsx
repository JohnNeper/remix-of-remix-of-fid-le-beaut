import React, { useState, useMemo } from 'react';
import {
  Gift, Star, Award, TrendingUp, RotateCcw, Trophy,
  Users, Crown, Shield, Sparkles, CheckCircle2, ChevronRight, ChevronLeft,
  Zap, Heart, Target, Settings, Search, Phone, MessageSquare, Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useClients } from '@/hooks/useClients';
import { useSalon } from '@/hooks/useSalon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// ─── Tier config ────────────────────────────────────────────────────────────────
// TIERS is moved inside Fidelite for dynamic translations

export default function Fidelite() {
  const { clients, updateClient } = useClients();
  const { salon, updateSalon } = useSalon();
  const { t, language } = useLanguage();
  const { hasLoyaltyRules, hasBirthdayBonus, getUpgradePlan, plan } = useSubscriptionPlan();

  const TIERS = useMemo(() => [
    {
      key: 'nouvelle',
      label: t('loyalty.tier.nouvelle', 'Nouvelle'),
      icon: Heart,
      color: '#a78bfa',
      bg: 'from-violet-500/20 to-purple-500/10',
      border: 'border-violet-400/30',
      badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
      minVisits: 0,
      maxVisits: 4,
      description: `0 – 4 ${t('dashboard.visits', 'visites')}`,
      tip: t('loyalty.tip.nouvelle', 'Fidélisez-la dès ses premiers soins !'),
    },
    {
      key: 'reguliere',
      label: t('loyalty.tier.reguliere', 'Régulière'),
      icon: Shield,
      color: '#60a5fa',
      bg: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-400/30',
      badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
      minVisits: 5,
      maxVisits: 14,
      description: `5 – 14 ${t('dashboard.visits', 'visites')}`,
      tip: t('loyalty.tip.reguliere', 'Bientôt membre du club VIP !'),
    },
    {
      key: 'vip',
      label: t('loyalty.tier.vip', 'VIP ✦'),
      icon: Crown,
      color: '#f59e0b',
      bg: 'from-amber-500/20 to-yellow-500/10',
      border: 'border-amber-400/30',
      badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30 font-bold',
      minVisits: 15,
      maxVisits: Infinity,
      description: `15+ ${t('dashboard.visits', 'visites')}`,
      tip: t('loyalty.tip.vip', 'Vos meilleures ambassadrices !'),
    },
  ], [t]);

  const [resetConfirm, setResetConfirm] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'progression' | 'tiers' | 'roadmap'>('progression');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'gift_ready' | 'vip' | 'reguliere' | 'nouvelle'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Config Form State
  const [visitesConfig, setVisitesConfig] = useState(salon?.configFidelite?.visitesRequises || 10);
  const [reductionConfig, setReductionConfig] = useState(salon?.configFidelite?.reductionPourcentage || 10);
  const [vipConfig, setVipConfig] = useState(salon?.configFidelite?.visitesVIP || 15);

  // Derived settings
  const visitsReq = salon?.configFidelite?.visitesRequises || 10;
  const vipThreshold = salon?.configFidelite?.visitesVIP || 15;
  const reductionPct = salon?.configFidelite?.reductionPourcentage || 10;

  const clientsVIP = clients.filter(c => c.statut === 'vip');
  const clientsReg = clients.filter(c => c.statut === 'reguliere');
  const clientsNouv = clients.filter(c => c.statut === 'nouvelle' || (!c.statut));
  const totalPointsDistributed = clients.reduce((s, c) => s + (c.pointsFidelite || 0), 0);
  const totalVisits = clients.reduce((s, c) => s + (c.nombreVisites || 0), 0);

  const getClientTier = (nombreVisites: number) => {
    if (nombreVisites >= vipThreshold) return TIERS[2];
    if (nombreVisites >= 5) return TIERS[1];
    return TIERS[0];
  };

  const clientsWithProgress = useMemo(() => {
    return clients.map(client => {
      const pts = client.pointsFidelite || 0;
      const visits = client.nombreVisites || 0;
      const pointsVersProchaineCadeau = pts % visitsReq;
      const progress = visitsReq > 0 ? (pointsVersProchaineCadeau / visitsReq) * 100 : 0;
      const cadeauxGagnes = visitsReq > 0 ? Math.floor(pts / visitsReq) : 0;
      const tier = getClientTier(visits);
      return { ...client, progress, cadeauxGagnes, pointsVersProchaineCadeau, tier };
    }).sort((a, b) => (b.nombreVisites || 0) - (a.nombreVisites || 0));
  }, [clients, visitsReq, vipThreshold]);

  const filteredClients = useMemo(() => {
    return clientsWithProgress.filter(client => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = client.nom.toLowerCase().includes(q) || client.telephone.includes(q);

      if (!matchesSearch) return false;
      if (statusFilter === 'gift_ready') return client.cadeauxGagnes > 0;
      if (statusFilter === 'vip') return client.statut === 'vip';
      if (statusFilter === 'reguliere') return client.statut === 'reguliere';
      if (statusFilter === 'nouvelle') return client.statut === 'nouvelle';

      return true;
    });
  }, [clientsWithProgress, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    return filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredClients, currentPage]);

  const handleSaveConfig = async () => {
    try {
      await updateSalon({
        configFidelite: {
          visitesRequises: Number(visitesConfig),
          reductionPourcentage: Number(reductionConfig),
          visitesVIP: Number(vipConfig),
        },
      });
      setShowConfigModal(false);
      toast.success(t('loyalty.rules_updated', 'Règles de fidélité enregistrées avec succès !'));
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour des règles');
    }
  };

  const handleRedeemGift = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    updateClient(clientId, { pointsFidelite: 0 });
    toast.success(`🎁 Cadeau offert à ${client.nom} ! Points remis à zéro.`);
    setResetConfirm(null);
  };

  const handleToggleVip = (client: any) => {
    const newStatus = client.statut === 'vip' ? 'reguliere' : 'vip';
    updateClient(client.id, { statut: newStatus });
    toast.success(`${client.nom} est maintenant ${newStatus === 'vip' ? 'VIP ✦' : 'Régulière'}`);
  };

  const handleSendWhatsAppReminder = (client: any) => {
    const cleanPhone = client.telephone.replace(/\D/g, '');
    const msg = `Bonjour ${client.nom} 👋 Vous êtes à ${visitsReq - client.pointsVersProchaineCadeau} visite(s) de recevoir votre réduction fidélité de -${reductionPct}% chez ${salon?.nom || 'notre salon'}. À très bientôt ! ✨`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const resetClient = resetConfirm ? clients.find(c => c.id === resetConfirm) : null;

  // Tier distribution percentages
  const total = clients.length || 1;
  const vipPct = Math.round((clientsVIP.length / total) * 100);
  const regPct = Math.round((clientsReg.length / total) * 100);
  const nouvPct = 100 - vipPct - regPct;

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-6xl mx-auto font-sans animate-in fade-in duration-300">

      {/* ── HEADER CARD ─────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-border/50 shadow-sm bg-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border-primary/20">
                <Crown className="h-3.5 w-3.5 mr-1 text-primary" />
                {t('loyalty.title', 'Programme Fidélité')}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {t('loyalty.hero_title', 'Fidélisez et Récompensez vos Clientes')}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl font-medium">
              {t('loyalty.hero_desc', 'Attribuez des points, débloquez des réductions automatiques et développez la récurrence de votre salon.')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="bg-muted/40 rounded-xl p-3.5 text-center border border-border/50 flex-1 md:flex-none">
              <p className="text-xl sm:text-2xl font-black text-foreground">{visitsReq} <span className="text-xs font-semibold text-muted-foreground">{t('loyalty.visits_req', 'visites → cadeau')}</span></p>
              <p className="text-xs font-bold text-primary flex items-center justify-center gap-1 mt-0.5">
                <Sparkles className="h-3.5 w-3.5" />
                -{reductionPct}% {t('loyalty.discount', 'de réduction')}
              </p>
            </div>

            <Button
              onClick={() => setShowConfigModal(true)}
              variant="outline"
              className="h-11 px-4 rounded-xl font-bold border-border/60 hover:bg-muted text-xs shrink-0 shadow-sm"
            >
              <Settings className="h-4 w-4 mr-2 text-primary" />
              <span>{t('loyalty.btn_config', 'Configurer les règles')}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ── STATS CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Crown className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{t('loyalty.vipClients', 'Clientes VIP')}</p>
            <p className="text-lg font-black text-foreground">{clientsVIP.length}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{t('loyalty.ofClients', 'sur {count} clientes', { count: clients.length })}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{t('loyalty.pointsDistributed', 'Points distribués')}</p>
            <p className="text-lg font-black text-foreground">{totalPointsDistributed} {t('common.pts', 'pts')}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{t('loyalty.total', 'au total')}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{t('loyalty.totalVisits', 'Visites totales')}</p>
            <p className="text-lg font-black text-foreground">{totalVisits}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{t('loyalty.recorded', 'enregistrées')}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{t('loyalty.giftsReady', 'Cadeaux prêts')}</p>
            <p className="text-lg font-black text-foreground">{clientsWithProgress.filter(c => c.cadeauxGagnes > 0).length}</p>
            <p className="text-[10px] text-emerald-500 font-bold">{t('loyalty.toOffer', 'à offrir')}</p>
          </div>
        </div>
      </div>

      {/* ── TIER DISTRIBUTION BAR ────────────────────────────────────────── */}
      <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <Users className="h-4 w-4 text-primary" />
            {t('loyalty.tierDistribution', 'Distribution des Niveaux de Fidélité')}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="flex h-5 rounded-full overflow-hidden gap-1 bg-muted/40 p-0.5 border border-border/40">
            {vipPct > 0 && (
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700 flex items-center justify-center" style={{ width: `${vipPct}%` }}>
                {vipPct > 8 && <span className="text-[9px] font-black text-white">{vipPct}%</span>}
              </div>
            )}
            {regPct > 0 && (
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-700 flex items-center justify-center" style={{ width: `${regPct}%` }}>
                {regPct > 8 && <span className="text-[9px] font-black text-white">{regPct}%</span>}
              </div>
            )}
            {nouvPct > 0 && (
              <div className="bg-gradient-to-r from-violet-400 to-violet-500 rounded-full transition-all duration-700 flex items-center justify-center" style={{ width: `${Math.max(nouvPct, 0)}%` }}>
                {nouvPct > 8 && <span className="text-[9px] font-black text-white">{nouvPct}%</span>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIERS.map((tier, i) => {
              const count = i === 0 ? clientsNouv.length : i === 1 ? clientsReg.length : clientsVIP.length;
              const pct = i === 0 ? nouvPct : i === 1 ? regPct : vipPct;
              return (
                <div key={tier.key} className={cn('rounded-2xl p-3.5 border', tier.border, `bg-gradient-to-br ${tier.bg}`)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <tier.icon className="h-4 w-4" style={{ color: tier.color }} />
                      <span className="text-xs font-black" style={{ color: tier.color }}>{tier.label}</span>
                    </div>
                    <span className="text-base font-black text-foreground">{count}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-semibold">{pct}% · {tier.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── UPGRADE BANNERS ─────────────────────────────────────────────── */}
      {!hasLoyaltyRules && (
        <UpgradePrompt feature={t('loyalty.advancedRules', 'Règles de fidélité avancées')} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
      )}

      {/* ── TAB NAV & CONTROLS ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex bg-muted/60 p-1 rounded-2xl border border-border/40 w-full sm:w-auto">
          {([
            { key: 'progression', label: t('loyalty.progress', 'Progression des clientes'), icon: TrendingUp },
            { key: 'tiers', label: t('loyalty.tiersAndBenefits', 'Niveaux & Avantages'), icon: Crown },
            { key: 'roadmap', label: t('loyalty.programGuide', 'Guide du programme'), icon: Target },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition-all',
                activeTab === tab.key ? 'bg-background shadow-md text-foreground font-black' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'progression' && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t('loyalty.searchPlaceholder', 'Rechercher par nom ou téléphone...')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-8 h-9 rounded-xl bg-card border-border/40 text-xs font-medium"
            />
          </div>
        )}
      </div>

      {/* ── TAB: PROGRESSION ────────────────────────────────────────────── */}
      {activeTab === 'progression' && (
        <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card">
          <CardHeader className="py-4 px-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              <span>{t('loyalty.clientLoyaltyProgress', 'Progression Fidélité des Clientes')}</span>
            </CardTitle>

            {/* Quick Filter Buttons */}
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0',
                  statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground'
                )}
              >
                {t('loyalty.all', 'Tous')} ({clientsWithProgress.length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('gift_ready'); setCurrentPage(1); }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1',
                  statusFilter === 'gift_ready' ? 'bg-emerald-600 text-white' : 'bg-emerald-500/10 text-emerald-600'
                )}
              >
                <Gift className="h-3 w-3" />
                {t('loyalty.giftReady', 'Cadeaux prêts')} ({clientsWithProgress.filter((c) => c.cadeauxGagnes > 0).length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('vip'); setCurrentPage(1); }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0',
                  statusFilter === 'vip' ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-600'
                )}
              >
                VIP ({clientsVIP.length})
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredClients.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                  <Users className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="font-bold text-foreground">{t('loyalty.noClientsCriteria', 'Aucune cliente ne correspond à ces critères')}</p>
                <p className="text-xs text-muted-foreground">{t('loyalty.tryModifyingSearch', 'Essayez de modifier votre recherche ou vos filtres')}</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border/30">
                  {paginatedClients.map((client) => {
                    const tier = client.tier;
                    const TierIcon = tier.icon;
                    return (
                      <div
                        key={client.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-muted/20 transition-colors"
                      >
                        {/* Avatar & Info */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <div className="relative shrink-0">
                            <div
                              className="h-11 w-11 rounded-2xl flex items-center justify-center font-black text-base shadow-sm border border-border/40"
                              style={{ background: `linear-gradient(135deg, ${tier.color}30, ${tier.color}15)` }}
                            >
                              <span style={{ color: tier.color }}>{client.nom.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm sm:text-base text-foreground truncate">{client.nom}</h4>
                              <Badge variant="outline" className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', tier.badge)}>
                                <TierIcon className="h-3 w-3 mr-1" />
                                {tier.label}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold flex-wrap">
                              <span><strong className="text-foreground">{client.nombreVisites || 0}</strong> {t('dashboard.visits', 'visites')}</span>
                              <span>·</span>
                              <span><strong className="text-primary">{client.pointsFidelite || 0}</strong> {t('loyalty.pointsAccumulated', 'points accumulés')}</span>
                              {client.cadeauxGagnes > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                  🎁 {client.cadeauxGagnes} réduction(s) débloquée(s) !
                                </span>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2 max-w-md space-y-1">
                              <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                                <span>{t('loyalty.nextGiftProgress', 'Progression prochain cadeau')}</span>
                                <span className="text-primary">{client.pointsVersProchaineCadeau} / {visitsReq} visites</span>
                              </div>
                              <div className="h-2 bg-muted/60 rounded-full overflow-hidden border border-border/30">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${client.progress}%`,
                                    background: `linear-gradient(90deg, ${tier.color}90, ${tier.color})`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Shortcuts */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20">
                          {/* WhatsApp Offer Reminder */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendWhatsAppReminder(client)}
                            className="rounded-xl h-8 px-2.5 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            title={t('loyalty.sendWhatsappReminder', 'Envoyer un rappel de fidélité sur WhatsApp')}
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" /> WhatsApp
                          </Button>

                          {/* Redeem Gift Button */}
                          {client.cadeauxGagnes > 0 && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
                              onClick={() => setResetConfirm(client.id)}
                            >
                              <Gift className="h-3.5 w-3.5 mr-1" /> {t('loyalty.offerGift', 'Offrir le cadeau')}
                            </Button>
                          )}

                          {/* Toggle VIP button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleVip(client)}
                            className={cn('rounded-xl h-8 px-2.5 text-xs font-bold', client.statut === 'vip' ? 'text-amber-500' : 'text-muted-foreground')}
                            title={t('loyalty.toggleVipStatus', 'Modifier le statut VIP')}
                          >
                            <Crown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-border/30">
                    <span className="text-xs text-muted-foreground font-semibold">{t('common.page') || 'Page'} {currentPage} {t('common.of') || 'sur'} {totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0 rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB: TIERS ──────────────────────────────────────────────────── */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          {TIERS.map((tier) => {
            const TierIcon = tier.icon;
            const count = tier.key === 'nouvelle' ? clientsNouv.length : tier.key === 'reguliere' ? clientsReg.length : clientsVIP.length;

            return (
              <Card key={tier.key} className={cn('rounded-3xl border shadow-sm overflow-hidden', tier.border)}>
                <CardContent className={cn('p-5 bg-gradient-to-br', tier.bg)}>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md" style={{ background: `${tier.color}25` }}>
                      <TierIcon className="h-6 w-6" style={{ color: tier.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-black text-lg text-foreground">{tier.label}</h3>
                          <p className="text-xs text-muted-foreground font-semibold">{tier.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black" style={{ color: tier.color }}>{count}</span>
                          <p className="text-xs text-muted-foreground font-semibold">clientes</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">"{tier.tip}"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── TAB: ROADMAP ────────────────────────────────────────────────── */}
      {activeTab === 'roadmap' && (
        <Card className="rounded-3xl border-border/40 shadow-sm bg-card p-6">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t('loyalty.howItWorks', 'Fonctionnement du Programme Fidélité')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-border/40 bg-muted/30 space-y-2">
                <div className="h-8 w-8 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-black">1</div>
                <h4 className="font-bold text-sm">{t('loyalty.step1Title', 'Prise de rendez-vous / Soin')}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('loyalty.step1Desc', 'Chaque soin réalisé rapporte 1 point de fidélité à la cliente.')}</p>
              </div>
              <div className="p-4 rounded-2xl border border-border/40 bg-muted/30 space-y-2">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">2</div>
                <h4 className="font-bold text-sm">{t('loyalty.step2Title', 'Seuil de Réduction')} ({visitsReq} {t('dashboard.visits', 'visites')})</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('loyalty.step2Desc', 'Une réduction automatique de -{reductionPct}% est débloquée sur la prochaine facture.')}</p>
              </div>
              <div className="p-4 rounded-2xl border border-border/40 bg-muted/30 space-y-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">3</div>
                <h4 className="font-bold text-sm">{t('loyalty.step3Title', 'Statut VIP')} ({vipThreshold}+ {t('dashboard.visits', 'visites')})</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('loyalty.step3Desc', 'Le statut VIP est acquis de façon permanente avec avantages exclusifs.')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── CONFIG LOYALTY RULES MODAL ─────────────────────────────────────── */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Settings className="h-5 w-5 text-rose-500" />
              {t('loyalty.configTitle', 'Configurer le Programme Fidélité')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              {t('loyalty.configDesc', 'Modifiez les règles de votre salon pour récompenser vos clientes régulières.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">{t('loyalty.configVisitsLabel', 'Nombre de visites pour un cadeau / réduction')}</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={visitesConfig}
                onChange={(e) => setVisitesConfig(Number(e.target.value))}
                className="rounded-xl h-10 font-bold"
              />
              <p className="text-[11px] text-muted-foreground">{t('loyalty.configVisitsHint', 'Ex: 10 visites pour débloquer une réduction.')}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">{t('loyalty.configDiscountLabel', 'Pourcentage de réduction offert (%)')}</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={reductionConfig}
                onChange={(e) => setReductionConfig(Number(e.target.value))}
                className="rounded-xl h-10 font-bold text-emerald-600"
              />
              <p className="text-[11px] text-muted-foreground">Ex: 10% de réduction sur la prestation.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">{t('loyalty.configVipLabel', 'Visites nécessaires pour devenir VIP ✦')}</label>
              <Input
                type="number"
                min={5}
                max={100}
                value={vipConfig}
                onChange={(e) => setVipConfig(Number(e.target.value))}
                className="rounded-xl h-10 font-bold text-amber-500"
              />
              <p className="text-[11px] text-muted-foreground">{t('loyalty.configVipHint', 'Ex: 15 visites pour passer automatiquement VIP.')}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/40">
            <Button variant="outline" onClick={() => setShowConfigModal(false)} className="flex-1 rounded-xl h-10 font-bold text-xs">
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button onClick={handleSaveConfig} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 rounded-xl text-xs shadow-md">
              {t('loyalty.saveRules', 'Enregistrer les règles')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── GIFT DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={!!resetConfirm} onOpenChange={() => setResetConfirm(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Gift className="h-5 w-5 text-emerald-500" />
              {t('loyalty.offerGiftTitle', 'Offrir le cadeau fidélité')}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                {resetClient && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border/40">
                      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary">
                        {resetClient.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{resetClient.nom}</p>
                        <p className="text-xs text-muted-foreground">{resetClient.nombreVisites || 0} {t('dashboard.visits', 'visites')} · {resetClient.pointsFidelite || 0} {t('common.pts', 'pts')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {t('loyalty.giftConfirmText', 'Vous allez offrir la réduction de -{pct}% à {nom}.', { pct: reductionPct, nom: resetClient.nom })}
                    </p>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-3">
            <Button variant="outline" onClick={() => setResetConfirm(null)} className="flex-1 rounded-xl h-10 font-bold text-xs">
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button
              onClick={() => resetConfirm && handleRedeemGift(resetConfirm)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl text-xs shadow-md"
            >
              <Gift className="h-4 w-4 mr-1.5" />
              {t('common.confirm', 'Confirmer')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
