import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Sparkles,
  Plus,
  Scissors,
  Star,
  Gift,
  ArrowRight,
  MessageCircle,
  Package,
  CheckCircle2,
  Phone,
  Zap,
  Building2,
  Lightbulb,
  ShoppingBag,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { TodayAppointments } from '@/components/dashboard/TodayAppointments';
import { RevenueByServiceType } from '@/components/dashboard/RevenueByServiceType';
import { StockAlerts } from '@/components/dashboard/StockAlerts';
import { ProTipsCard } from '@/components/dashboard/ProTipsCard';
import { useTranslations } from '@/hooks/useTranslations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClients } from '@/hooks/useClients';
import { usePrestations } from '@/hooks/usePrestations';
import { useFinances } from '@/hooks/useFinances';
import { useSalon } from '@/hooks/useSalon';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useStock, getExpirationStatus } from '@/hooks/useStock';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import heroSalon from '@/assets/hero-salon.jpg';
import { OnboardingGuide } from '@/components/dashboard/OnboardingGuide';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Dashboard() {
  const { clients, loading: loadingClients } = useClients();
  const { typesPrestations, prestations, getTypePrestation } = usePrestations();
  const { ventes, depenses, loadingVentes } = useFinances();
  const { salon } = useSalon();
  const { session } = useAuth();
  const { t, language } = useLanguage();
  const { formatCurrency } = useTranslations();
  const { produits } = useStock();
  const { rendezVous } = useRendezVous();
  const queryClient = useQueryClient();

  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isOwner = session?.userRole === 'owner' || session?.userRole === 'co_owner' || session?.type === 'admin';

  // Manual refresh callback
  const handleRefresh = async () => {
    if (isRefreshing || !session?.salonId) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ventes', session.salonId] }),
        queryClient.invalidateQueries({ queryKey: ['depenses', session.salonId] }),
        queryClient.invalidateQueries({ queryKey: ['prestations', session.salonId] }),
        queryClient.invalidateQueries({ queryKey: ['produits', session.salonId] }),
        queryClient.invalidateQueries({ queryKey: ['rendezVous', session.salonId] }),
        queryClient.invalidateQueries({ queryKey: ['clients', session.salonId] }),
      ]);
      toast.success(t('dashboard.refreshed') || 'Tableau de bord actualisé avec succès');
    } catch (err) {
      console.error('Erreur actualisation dashboard:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format today's date nicely
  const formattedTodayDate = useMemo(() => {
    const now = new Date();
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);
  }, [language]);

  const dashboardStats = useMemo(() => {
    if (!clients || !prestations || !rendezVous) return null;

    const activeClientsCount = clients.length;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localTodayStr = `${year}-${month}-${day}`;
    const isoTodayStr = now.toISOString().split('T')[0];

    const currentMonthPrefix = `${year}-${month}`;
    const firstDayOfMonth = new Date(year, now.getMonth(), 1);

    // ── 1. Toutes les ventes enregistrées ce mois (Caisse, Finances, Prestations) ──
    const monthVentes = (ventes || []).filter(v => {
      if (v.statut === 'annulee') return false;
      if (!v.date) return false;
      return v.date.startsWith(currentMonthPrefix);
    });

    const monthVentesRevenue = monthVentes.reduce((acc, v) => acc + (v.totalMontant || 0), 0);

    // Ventilation par type d'élément dans les ventes
    const monthPrestationsRevenueFromVentes = monthVentes.reduce((acc, v) => {
      const prestItems = (v.items || []).filter(i => i.type === 'prestation');
      return acc + prestItems.reduce((sum, i) => sum + (i.montant || 0), 0);
    }, 0);

    const monthProduitsRevenueFromVentes = monthVentes.reduce((acc, v) => {
      const prodItems = (v.items || []).filter(i => i.type === 'produit');
      return acc + prodItems.reduce((sum, i) => sum + (i.montant || 0), 0);
    }, 0);

    const otherCaisseRevenue = monthVentes.reduce((acc, v) => {
      const otherItems = (v.items || []).filter(i => i.type !== 'prestation' && i.type !== 'produit');
      if (otherItems.length > 0) {
        return acc + otherItems.reduce((sum, i) => sum + (i.montant || 0), 0);
      }
      if (!v.items || v.items.length === 0) {
        return acc + (v.totalMontant || 0);
      }
      return acc;
    }, 0);

    // ── 2. Prestations effectuées issues du module prestations ──
    const monthPrestations = prestations.filter(p => {
      if (!p.date) return false;
      return new Date(p.date) >= firstDayOfMonth;
    });

    // Détecter d'éventuelles prestations orphelines (enregistrées sans vente liée)
    const orphanPrestations = monthPrestations.filter(p => {
      const isAlreadyInVentes = monthVentes.some(v => {
        const sameDate = v.date === p.date;
        const sameClient = !p.clientId || v.clientId === p.clientId || (v.clientId != null && typeof v.clientId === 'object' && (v.clientId as any)._id === p.clientId);
        const hasMatchingPrestationItem = (v.items || []).some(item =>
          item.type === 'prestation' &&
          (String(item.referenceId) === String(p.typePrestationId) || item.nom.toLowerCase() === (getTypePrestation(p.typePrestationId)?.nom || '').toLowerCase()) &&
          Math.abs((item.montant || 0) - (p.montant || 0)) < 1
        );
        return sameDate && (sameClient || hasMatchingPrestationItem);
      });
      return !isAlreadyInVentes;
    });

    const orphanPrestationsRevenue = orphanPrestations.reduce((acc, p) => acc + (p.montant || 0), 0);

    // Chiffre d'affaires total consolidé (Soins + Produits vendus + Entrées caisse)
    const monthRevenue = monthVentesRevenue + orphanPrestationsRevenue;
    const monthRevenuePrestations = monthPrestationsRevenueFromVentes + orphanPrestationsRevenue;
    const monthRevenueProduits = monthProduitsRevenueFromVentes;
    const monthRevenueAutres = otherCaisseRevenue;

    // Nombre de prestations / visites réalisées ce mois
    const totalPrestationsCountInVentes = monthVentes.reduce((acc, v) => {
      const count = (v.items || []).filter(i => i.type === 'prestation').reduce((s, i) => s + (i.quantite || 1), 0);
      return acc + count;
    }, 0);
    const monthVisitsCount = totalPrestationsCountInVentes + orphanPrestations.length;

    // ── 3. Rendez-vous du jour ──
    const todayRdv = rendezVous.filter(r => r.date === localTodayStr || r.date === isoTodayStr);

    // ── 4. Statistiques personnelles Staff ──
    const myTodayRdv = todayRdv.filter(r => r.employe === session?.userId || r.employe === session?.userName);
    
    const myTodayPrestationsInVentes = (ventes || []).filter(v => {
      if (v.statut === 'annulee') return false;
      const isToday = v.date === localTodayStr || v.date === isoTodayStr;
      const isMyStaff = v.employe === session?.userId || v.employe === session?.userName || (typeof v.employe === 'object' && ((v.employe as any)?._id === session?.userId || (v.employe as any)?.name === session?.userName));
      return isToday && isMyStaff;
    });
    const myTodayPrestationsCount = myTodayPrestationsInVentes.length || prestations.filter(p => (p.employe === session?.userName || p.employe === session?.userId) && (p.date === localTodayStr || p.date === isoTodayStr)).length;

    const myMonthPrestationsInVentes = monthVentes.filter(v => {
      const isMyStaff = v.employe === session?.userId || v.employe === session?.userName || (typeof v.employe === 'object' && ((v.employe as any)?._id === session?.userId || (v.employe as any)?.name === session?.userName));
      return isMyStaff;
    });
    const myMonthPrestationsCount = myMonthPrestationsInVentes.length || prestations.filter(p => (p.employe === session?.userName || p.employe === session?.userId) && new Date(p.date) >= firstDayOfMonth).length;

    // ── 5. Revenus par type de prestation (consolidant ventes caisse et prestations) ──
    const revByType = typesPrestations.map(type => {
      let typeRev = 0;
      let typeCount = 0;

      monthVentes.forEach(v => {
        (v.items || []).forEach(item => {
          if (item.type === 'prestation' && (String(item.referenceId) === String(type.id) || item.nom.toLowerCase() === type.nom.toLowerCase())) {
            typeRev += (item.montant || 0);
            typeCount += (item.quantite || 1);
          }
        });
      });

      orphanPrestations.forEach(p => {
        if (String(p.typePrestationId) === String(type.id)) {
          typeRev += (p.montant || 0);
          typeCount += 1;
        }
      });

      return {
        nom: type.nom,
        revenue: typeRev,
        count: typeCount
      };
    }).filter(t => t.count > 0 || t.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const finalRevByType = revByType.length > 0 ? revByType : typesPrestations.slice(0, 5).map(type => ({
      nom: type.nom,
      revenue: 0,
      count: 0
    }));

    // ── 6. Calcul dynamique de tendance vs mois précédent ──
    const lastMonthYear = now.getMonth() === 0 ? year - 1 : year;
    const lastMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastMonthPrefix = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}`;
    const lastMonthRevenue = (ventes || [])
      .filter(v => v.statut !== 'annulee' && v.date && v.date.startsWith(lastMonthPrefix))
      .reduce((sum, v) => sum + (v.totalMontant || 0), 0);

    let trend: { value: number; positive: boolean } | undefined = undefined;
    if (lastMonthRevenue > 0) {
      const diffPct = Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
      trend = { value: Math.abs(diffPct), positive: diffPct >= 0 };
    } else if (monthRevenue > 0) {
      trend = { value: 100, positive: true };
    }

    // ── 7. Calcul des Dépenses du mois courant et précédent ──
    const monthDepenses = (depenses || []).filter(d => {
      if (!d.date) return false;
      return d.date.startsWith(currentMonthPrefix);
    });
    const monthExpenses = monthDepenses.reduce((acc, d) => acc + (d.montant || 0), 0);
    const monthExpensesCount = monthDepenses.length;

    const lastMonthDepenses = (depenses || [])
      .filter(d => d.date && d.date.startsWith(lastMonthPrefix))
      .reduce((sum, d) => sum + (d.montant || 0), 0);

    let expenseTrend: { value: number; positive: boolean } | undefined = undefined;
    if (lastMonthDepenses > 0) {
      const diffPct = Math.round(((monthExpenses - lastMonthDepenses) / lastMonthDepenses) * 100);
      expenseTrend = { value: Math.abs(diffPct), positive: diffPct <= 0 };
    } else if (monthExpenses > 0) {
      expenseTrend = { value: 100, positive: false };
    }

    const monthNetProfit = monthRevenue - monthExpenses;

    return {
      activeClientsCount,
      monthRevenue,
      monthExpenses,
      monthExpensesCount,
      expenseTrend,
      monthNetProfit,
      monthRevenuePrestations,
      monthRevenueProduits,
      monthRevenueAutres,
      monthVisitsCount,
      todayRdvCount: todayRdv.length,
      todayRdv,
      revByType: finalRevByType,
      trend,
      myTodayRdvCount: myTodayRdv.length,
      myTodayPrestationsCount,
      myMonthPrestationsCount,
      myTodayRdv
    };
  }, [clients, prestations, rendezVous, typesPrestations, session, ventes, depenses, getTypePrestation]);

  const alertProducts = useMemo(() => {
    return produits.filter(p => {
      const isLowStock = p.quantite <= p.seuilAlerte;
      const exp = getExpirationStatus(p.datePeremption);
      const isExpiring = exp.status === 'expired' || exp.status === 'warning';
      return isLowStock || isExpiring;
    });
  }, [produits]);

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('237') ? cleanPhone : `237${cleanPhone}`;
    const text = encodeURIComponent(
      `Bonjour ${name}, nous serions ravis de vous accueillir à nouveau au salon ${salon?.name || 'BeautyFlow'} !`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  if (loadingClients) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <Skeleton className="h-64 w-full rounded-[32px]" />
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", isOwner ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
          {(isOwner ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map(i => <Skeleton key={i} className="h-40 rounded-[28px]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[450px] lg:col-span-2 rounded-[28px]" />
          <Skeleton className="h-[450px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto font-sans">
      
      {/* ========================================================================= */}
      {/* HERO BANNER - VISIBLE IMAGE & RICH GLASS OVERLAY */}
      {/* ========================================================================= */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 bg-slate-950 text-white transition-all min-h-[190px] sm:min-h-[220px]">
        {/* Background Image with HIGH VISIBILITY & Vibrant Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroSalon}
            alt="Salon Hero"
            className="w-full h-full object-cover opacity-75 scale-100 transition-transform duration-1000 ease-out hover:scale-105"
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/65 to-rose-950/45 backdrop-blur-[1px]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-5 sm:p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          
          <div className="space-y-2 max-w-2xl">
            {/* Salon Badge & Date */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-white text-xs font-bold backdrop-blur-md shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                <span>{t('dashboard.welcome')} {session?.userName || 'Gérant'}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-slate-100 text-xs font-semibold backdrop-blur-md border border-white/20 capitalize shadow-xs">
                <Calendar className="h-3.5 w-3.5 text-slate-200" />
                <span>{formattedTodayDate}</span>
              </span>
            </div>

            {/* Salon Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md leading-none">
              {salon?.name || "BeautySpace Salon"}
            </h1>

            <p className="text-slate-200 text-xs sm:text-sm font-medium leading-relaxed max-w-xl drop-shadow-sm">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto h-10 px-3.5 rounded-xl border-white/30 bg-black/40 hover:bg-black/60 text-white font-bold text-xs backdrop-blur-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-95 shadow-sm"
              title="Actualiser les données"
            >
              <RefreshCw className={cn("h-4 w-4 text-slate-200", isRefreshing && "animate-spin text-primary")} />
              <span>{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
            </Button>

            <Link to="/prestations" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-10 px-4 rounded-xl gradient-primary font-bold text-xs shadow-md flex items-center justify-center gap-2 border-0 transition-transform hover:scale-[1.01] active:scale-95">
                <Scissors className="h-4 w-4" />
                <span>{t('dashboard.newService')}</span>
              </Button>
            </Link>

            <Link to="/rendez-vous" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-10 px-4 rounded-xl border-white/30 bg-black/40 hover:bg-black/60 text-white font-bold text-xs backdrop-blur-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-95 shadow-sm">
                <Calendar className="h-4 w-4" />
                <span>{t('dashboard.newAppointment')}</span>
              </Button>
            </Link>

            <Link to="/clientes" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-10 px-4 rounded-xl border-white/30 bg-black/40 hover:bg-black/60 text-white font-bold text-xs backdrop-blur-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-95 shadow-sm">
                <UserPlus className="h-4 w-4" />
                <span>{t('dashboard.newClient')}</span>
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* STATS / KPI CARDS GRID */}
      {/* ========================================================================= */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4", isOwner ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
        
        {/* KPI 1: Monthly Revenue or Staff Prestations */}
        {isOwner ? (
          <StatCard
            title={t('dashboard.monthRevenue')}
            value={formatCurrency(dashboardStats?.monthRevenue || 0)}
            icon={DollarSign}
            trend={dashboardStats?.trend}
            subtitle={
              dashboardStats && (dashboardStats.monthRevenueProduits > 0 || dashboardStats.monthRevenuePrestations > 0)
                ? `${formatCurrency(dashboardStats.monthRevenuePrestations)} soins • ${formatCurrency(dashboardStats.monthRevenueProduits)} produits`
                : (t('dashboard.monthRevenueSub') || "Chiffre d'affaires enregistré ce mois")
            }
            variant="success"
          />
        ) : (
          <StatCard
            title={t('dashboard.myTodayPrestations')}
            value={dashboardStats?.myTodayPrestationsCount.toString() || '0'}
            icon={Scissors}
            subtitle={t('dashboard.myTodayPrestationsSub') || "Prestations réalisées aujourd'hui"}
            variant="primary"
          />
        )}

        {/* KPI 2: Monthly Expenses (Owner only) */}
        {isOwner && (
          <StatCard
            title={t('dashboard.monthExpenses') || 'Dépenses du mois'}
            value={formatCurrency(dashboardStats?.monthExpenses || 0)}
            icon={TrendingDown}
            trend={dashboardStats?.expenseTrend}
            subtitle={
              dashboardStats?.monthExpensesCount
                ? `${dashboardStats.monthExpensesCount} opération(s) ce mois`
                : (t('dashboard.monthExpensesSub') || "Charges enregistrées ce mois")
            }
            variant="danger"
          />
        )}

        {/* KPI 3: Today's Appointments */}
        <StatCard
          title={isOwner ? t('dashboard.todayAppointments') : t('dashboard.myTodayRdv')}
          value={isOwner ? dashboardStats?.todayRdvCount.toString() || '0' : dashboardStats?.myTodayRdvCount.toString() || '0'}
          icon={Calendar}
          subtitle={isOwner ? (t('dashboard.todayAppointmentsSub') || "Rendez-vous programmés aujourd'hui") : (t('dashboard.myTodayRdvSub') || "Mes rendez-vous du jour")}
          variant="warning"
        />

        {/* KPI 4: Monthly Visits / Services */}
        <StatCard
          title={isOwner ? t('dashboard.monthVisits') : t('dashboard.myMonthPrestations')}
          value={isOwner ? dashboardStats?.monthVisitsCount.toString() || '0' : dashboardStats?.myMonthPrestationsCount.toString() || '0'}
          icon={TrendingUp}
          subtitle={isOwner ? (t('dashboard.monthVisitsSub') || "Prestations effectuées ce mois") : (t('dashboard.myMonthPrestationsSub') || "Mes prestations ce mois")}
          variant="purple"
        />

        {/* KPI 5: Total Active Clients */}
        <StatCard
          title={t('dashboard.totalClients')}
          value={clients.length.toString()}
          icon={Users}
          subtitle={`${dashboardStats?.activeClientsCount || 0} ${t('dashboard.activeClients')}`}
          variant="accent"
        />

      </div>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Appointments Component */}
          <TodayAppointments
            rendezVous={isOwner
              ? dashboardStats?.todayRdv || []
              : dashboardStats?.myTodayRdv || []
            }
            clients={clients}
            typesPrestations={typesPrestations}
          />

          {/* Revenue Breakdown / Service Types Chart */}
          {isOwner && (
            <RevenueByServiceType data={dashboardStats?.revByType || []} />
          )}

        </div>

        {/* RIGHT COLUMN (1/3 Width) */}
        <div className="space-y-6">
          
          {/* Stock Alerts Widget */}
          <StockAlerts produits={alertProducts} />

          {/* BeautyFlow Pro Tip Card */}
          <ProTipsCard />

          {/* Recent Clients Card */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
              <CardTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-foreground">
                <Users className="h-4.5 w-4.5 text-primary" />
                <span>{t('dashboard.recentClients')}</span>
              </CardTitle>

              <Link to="/clientes">
                <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-primary hover:bg-primary/10 px-2">
                  <span>{t('dashboard.viewAll')}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="px-4 sm:px-5 pb-4 space-y-2.5">
              {clients.length > 0 ? (
                clients
                  .sort((a, b) => new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime())
                  .slice(0, 5)
                  .map(client => (
                    <div key={client.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs shrink-0">
                          {client.nom.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-foreground truncate">{client.nom}</p>
                          <p className="text-[11px] text-muted-foreground font-medium">{client.telephone}</p>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[11px] font-extrabold text-primary border-primary/30 bg-primary/10 flex items-center gap-1 shrink-0 px-2 py-0.5">
                        <Gift className="h-3 w-3 text-primary" />
                        <span>{client.pointsFidelite || 0} {t('dashboard.pts')}</span>
                      </Badge>
                    </div>
                  ))
              ) : (
                <div className="text-center py-5 text-slate-500 dark:text-slate-400">
                  <Users className="h-8 w-8 mx-auto mb-1.5 opacity-30 text-slate-400" />
                  <p className="text-xs font-semibold">{t('dashboard.noClients')}</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
