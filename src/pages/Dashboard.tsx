import React, { useMemo } from 'react';
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
  TrendingDown
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
import { useSalon } from '@/hooks/useSalon';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useStock } from '@/hooks/useStock';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import heroSalon from '@/assets/hero-salon.jpg';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { clients, loading: loadingClients } = useClients();
  const { typesPrestations, prestations } = usePrestations();
  const { salon } = useSalon();
  const { session } = useAuth();
  const { t, language } = useLanguage();
  const { formatCurrency } = useTranslations();
  const { produits } = useStock();
  const { rendezVous } = useRendezVous();
  
  const isOwner = session?.userRole === 'owner' || session?.type === 'admin';

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

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthVisits = prestations.filter(p => new Date(p.date) >= firstDayOfMonth);
    const monthRevenue = monthVisits.reduce((acc, p) => acc + (p.montant || 0), 0);

    const todayRdv = rendezVous.filter(r => r.date === localTodayStr || r.date === isoTodayStr);

    // Personal stats for staff
    const myTodayRdv = todayRdv.filter(r => r.employe === session?.userId || r.employe === session?.userName);
    const myTodayPrestations = prestations.filter(p => (p.employe === session?.userName || p.employe === session?.userId) && (p.date === localTodayStr || p.date === isoTodayStr));
    const myMonthPrestations = prestations.filter(p => (p.employe === session?.userName || p.employe === session?.userId) && new Date(p.date) >= firstDayOfMonth);

    // Revenue by service type
    const revByType = typesPrestations.map(type => {
      const typePrestations = prestations.filter(p => p.typePrestationId === type.id);
      return {
        nom: type.nom,
        revenue: typePrestations.reduce((acc, p) => acc + (p.montant || 0), 0),
        count: typePrestations.length
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      activeClientsCount,
      monthRevenue,
      monthVisitsCount: monthVisits.length,
      todayRdvCount: todayRdv.length,
      todayRdv,
      revByType,
      myTodayRdvCount: myTodayRdv.length,
      myTodayPrestationsCount: myTodayPrestations.length,
      myMonthPrestationsCount: myMonthPrestations.length,
      myTodayRdv
    };
  }, [clients, prestations, rendezVous, typesPrestations, session]);

  const alertProducts = useMemo(() => {
    return produits.filter(p => p.quantite <= p.seuilAlerte);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-[28px]" />)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* KPI 1: Monthly Revenue or Staff Prestations */}
        {isOwner ? (
          <StatCard
            title={t('dashboard.monthRevenue')}
            value={formatCurrency(dashboardStats?.monthRevenue || 0)}
            icon={DollarSign}
            trend={{ value: 12, positive: true }}
            subtitle={t('dashboard.monthRevenueSub') || "Chiffre d'affaires enregistré ce mois"}
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

        {/* KPI 2: Today's Appointments */}
        <StatCard
          title={isOwner ? t('dashboard.todayAppointments') : t('dashboard.myTodayRdv')}
          value={isOwner ? dashboardStats?.todayRdvCount.toString() || '0' : dashboardStats?.myTodayRdvCount.toString() || '0'}
          icon={Calendar}
          subtitle={isOwner ? (t('dashboard.todayAppointmentsSub') || "Rendez-vous programmés aujourd'hui") : (t('dashboard.myTodayRdvSub') || "Mes rendez-vous du jour")}
          variant="warning"
        />

        {/* KPI 3: Monthly Visits / Services */}
        <StatCard
          title={isOwner ? t('dashboard.monthVisits') : t('dashboard.myMonthPrestations')}
          value={isOwner ? dashboardStats?.monthVisitsCount.toString() || '0' : dashboardStats?.myMonthPrestationsCount.toString() || '0'}
          icon={TrendingUp}
          subtitle={isOwner ? (t('dashboard.monthVisitsSub') || "Prestations effectuées ce mois") : (t('dashboard.myMonthPrestationsSub') || "Mes prestations ce mois")}
          variant="purple"
        />

        {/* KPI 4: Total Active Clients */}
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
