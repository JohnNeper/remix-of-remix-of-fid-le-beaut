import React, { useMemo } from 'react';
import { Users, UserCheck, UserX, Calendar, TrendingUp, Scissors, ArrowRight, Gift, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ServicesPieChart } from '@/components/dashboard/ServicesPieChart';
import { TodayAppointments } from '@/components/dashboard/TodayAppointments';
import { StockAlerts } from '@/components/dashboard/StockAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClients } from '@/hooks/useClients';
import { usePrestations } from '@/hooks/usePrestations';
import { useSalon } from '@/hooks/useSalon';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useStock } from '@/hooks/useStock';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { getPlanColor } from '@/lib/plans';
import heroSalon from '@/assets/hero-salon.jpg';
import serviceHair from '@/assets/service-hair.jpg';
import serviceMakeup from '@/assets/service-makeup.jpg';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-CM', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';
}

export default function Dashboard() {
  const { clients, getInactiveClients } = useClients();
  const { getPrestationsCeMois, getRevenusCeMois, getPrestationsPopulaires, typesPrestations, prestations } = usePrestations();
  const { salon } = useSalon();
  const { getRendezVousAujourdhui } = useRendezVous();
  const { produitsEnAlerte } = useStock();
  const { t } = useLanguage();

  const clientesInactives = getInactiveClients(salon.joursRappelInactivite);
  const clientesActives = clients.length - clientesInactives.length;
  const visitesCeMois = getPrestationsCeMois().length;
  const revenusCeMois = getRevenusCeMois();
  const prestationsPopulaires = getPrestationsPopulaires();
  const rdvAujourdhui = getRendezVousAujourdhui();
  const clientesVIP = clients.filter(c => c.statut === 'vip');

  const trend = useMemo(() => {
    const now = new Date();
    const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const thisRev = prestations.filter(p => p.date.startsWith(thisKey)).reduce((s, p) => s + p.montant, 0);
    const lastRev = prestations.filter(p => p.date.startsWith(lastKey)).reduce((s, p) => s + p.montant, 0);
    if (lastRev === 0) return undefined;
    const pct = Math.round(((thisRev - lastRev) / lastRev) * 100);
    return { value: Math.abs(pct), positive: pct >= 0 };
  }, [prestations]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative h-40 sm:h-48 lg:h-56 rounded-2xl overflow-hidden">
        <img src={heroSalon} alt="Salon de beauté" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent flex items-end p-4 sm:p-6">
          <div className="text-white">
            <p className="text-white/80 text-sm mb-1">{t('dashboard.welcome')}</p>
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">{salon.nom}</h1>
            <p className="text-white/80 mt-1 text-sm hidden sm:block">{t('dashboard.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard title={t('dashboard.totalClients')} value={clients.length} icon={Users} variant="primary" />
        <StatCard title={t('dashboard.activeClients')} value={clientesActives} subtitle={t('dashboard.activeLast30')} icon={UserCheck} variant="success" />
        <StatCard title={t('dashboard.inactiveClients')} value={clientesInactives.length} subtitle={`+${salon.joursRappelInactivite} ${t('dashboard.days')}`} icon={UserX} variant="warning" />
        <StatCard title={t('dashboard.todayAppointments')} value={rdvAujourdhui.length} icon={Calendar} variant="default" />
        <StatCard title={t('dashboard.monthRevenue')} value={formatCurrency(revenusCeMois)} icon={TrendingUp} variant="accent" trend={trend} />
        <StatCard title={t('dashboard.monthVisits')} value={visitesCeMois} icon={Scissors} variant="default" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <RevenueChart prestations={prestations} />
        <ServicesPieChart data={prestationsPopulaires} />
      </div>

      {/* RDV + Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <TodayAppointments rendezVous={rdvAujourdhui} clients={clients} typesPrestations={typesPrestations} />
        <StockAlerts produits={produitsEnAlerte} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="card-shadow overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="flex h-full">
            <div className="w-1/3 relative">
              <img src={serviceHair} alt="Coiffure" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <CardContent className="flex-1 p-4 flex flex-col justify-center">
              <h3 className="font-semibold text-base sm:text-lg mb-1">{t('dashboard.newService')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">{t('dashboard.registerVisit')}</p>
              <Link to="/prestations">
                <Button size="sm" className="gradient-primary"><ArrowRight className="h-4 w-4 mr-2" />{t('dashboard.add')}</Button>
              </Link>
            </CardContent>
          </div>
        </Card>
        <Card className="card-shadow overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="flex h-full">
            <div className="w-1/3 relative">
              <img src={serviceMakeup} alt="Maquillage" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <CardContent className="flex-1 p-4 flex flex-col justify-center">
              <h3 className="font-semibold text-base sm:text-lg mb-1">{t('dashboard.newClient')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">{t('dashboard.addClientDesc')}</p>
              <Link to="/clientes">
                <Button size="sm" className="gradient-primary"><ArrowRight className="h-4 w-4 mr-2" />{t('dashboard.add')}</Button>
              </Link>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* VIP + Recent Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              {t('dashboard.vipClients')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientesVIP.length > 0 ? (
              <div className="space-y-3">
                {clientesVIP.slice(0, 5).map(client => (
                  <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                    <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Star className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{client.nom}</p>
                      <p className="text-xs text-muted-foreground">{client.nombreVisites} {t('dashboard.visits')}</p>
                    </div>
                    <Badge className="bg-accent/20 text-accent border-0">
                      <Gift className="h-3 w-3 mr-1" />{client.pointsFidelite} {t('dashboard.pts')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">{t('dashboard.noVip')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('dashboard.recentClients')}
            </CardTitle>
            <Link to="/clientes">
              <Button variant="ghost" size="sm">{t('dashboard.viewAll')} <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {clients.length > 0 ? (
              <div className="space-y-3">
                {clients
                  .sort((a, b) => new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime())
                  .slice(0, 5)
                  .map(client => (
                    <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-primary font-semibold">{client.nom.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{client.nom}</p>
                        <p className="text-xs text-muted-foreground">{client.telephone}</p>
                      </div>
                      <Badge className={`shrink-0 border-0 ${
                        client.statut === 'vip' ? 'bg-accent/20 text-accent' :
                        client.statut === 'reguliere' ? 'bg-success/20 text-success' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {client.statut === 'vip' && <Star className="h-3 w-3 mr-1" />}
                        {client.statut.charAt(0).toUpperCase() + client.statut.slice(1)}
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">{t('dashboard.noClients')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
