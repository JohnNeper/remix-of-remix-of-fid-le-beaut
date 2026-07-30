import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Building2, CheckCircle, XCircle, RefreshCw, LogOut, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import bfLogo from '@/assets/BF.png';
import { useAuth } from '@/contexts/AuthContext';
import { getSalonAccounts, renewSalonSubscription, toggleSalonActive, isSalonSubscriptionActive } from '@/lib/auth';
import { SalonAccount } from '@/types/auth';
import { toast } from '@/hooks/use-toast';
import { StatCard } from '@/components/dashboard/StatCard';
import CreateSalonDialog from '@/components/admin/CreateSalonDialog';
import SalonCard from '@/components/admin/SalonCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Salon } from '@/types';
import { api } from '@/lib/api';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-CM', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSalons = async () => {
    try {
      setIsLoading(true);
      const data = await api.adminGetAllSalons();
      setSalons(data);

      const statsData = await api.adminGetStats();
      setStats(statsData);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('admin.errorLoadingSalons', 'Impossible de charger les salons'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSalons();
  }, []);

  const handleRenew = async (id: string) => {
    try {
      await api.adminUpdateSalonStatus(id, { statutAbonnement: 'actif' });
      toast({ title: t('admin.renewSuccess', 'Abonnement renouvelé') });
      fetchSalons();
    } catch (error) {
      toast({ title: t('admin.renewError', 'Erreur lors du renouvellement'), variant: 'destructive' });
    }
  };

  const handleToggle = async (salon: Salon) => {
    try {
      const payload = {
        isActive: !salon.isActive,
        // Preserve the current subscription status if present
        statutAbonnement: salon.abonnement?.statut || undefined,
      };
      await api.adminUpdateSalonStatus(salon._id, payload);
      toast({ title: salon.isActive ? t('admin.salonDeactivated', 'Salon désactivé') : t('admin.salonActivated', 'Salon activé') });
      fetchSalons();
    } catch (error) {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const activeSalons = salons.filter(s => isSalonSubscriptionActive(s));
  const revenuMensuel = activeSalons.length * 25000;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-background border border-muted flex items-center justify-center shadow-sm">
              <img src={bfLogo} alt="BeautyFlow Logo" className="h-5 w-5 sm:h-7 sm:w-7 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-lg text-foreground">{t('admin.title', 'BeautyFlow Admin')}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{t('admin.subtitle', 'Gestion des salons')}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('admin.logout', 'Déconnexion')}</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <StatCard title={t('admin.stats.totalSalons', 'Total Salons')} value={stats?.totalSalons || salons.length} icon={Building2} variant="primary" />
          <StatCard title={t('admin.stats.activeSalons', 'Salons Actifs')} value={activeSalonsCount} icon={CheckCircle} variant="success" />
          <StatCard title={t('admin.stats.expiredSalons', 'Salons Expirés')} value={(stats?.totalSalons || salons.length) - activeSalonsCount} icon={XCircle} variant="warning" />
          <StatCard title={t('admin.stats.monthlyRevenue', 'Revenu Mensuel')} value={formatCurrency(revenuMensuel)} icon={TrendingUp} variant="accent" />
        </div>

        {/* Salon list */}
        <Card className="card-shadow">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                {t('admin.registeredSalons', 'Salons enregistrés')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{salons.length} {t('admin.salonsCount', 'salon(s)')}</CardDescription>
            </div>
            <CreateSalonDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              existingEmails={salons.map(s => s.email)}
              onCreated={refresh}
            />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
              </div>
            ) : salons.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm sm:text-base">{t('admin.noSalons', 'Aucun salon enregistré')}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('admin.createFirstSalon', 'Créez votre premier salon pour commencer')}</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {salons.map(salon => (
                  <SalonCard
                    key={salon.id}
                    salon={salon}
                    onRenew={handleRenew}
                    onToggle={handleToggle}
                    onRefresh={refresh}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
