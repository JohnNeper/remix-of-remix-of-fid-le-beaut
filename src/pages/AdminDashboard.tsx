import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Building2, CheckCircle, XCircle, RefreshCw, LogOut, TrendingUp, Sparkles, MapPin, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import bfLogo from '@/assets/BF.png';
import { useAuth } from '@/contexts/AuthContext';
import { isSalonSubscriptionActive } from '@/lib/auth';
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

type FilterType = 'all' | 'active' | 'sponsored' | 'no-gps' | 'expired';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

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
        statutAbonnement: salon.abonnement?.statut || undefined,
      };
      await api.adminUpdateSalonStatus(salon._id || salon.id, payload);
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

  const activeSalons = salons.filter(s => s.isActive !== false && s.abonnement?.statut !== 'expire' && s.abonnement?.statut !== 'suspendu');
  const sponsoredSalons = salons.filter(s => !!(s as any).isSponsored || !!(s as any).branding?.isSponsored);
  const noGpsSalons = salons.filter(s => !s.location?.lat || !s.location?.lng);
  const activeSalonsCount = activeSalons.length;
  const revenuMensuel = activeSalonsCount * 25000;

  // Filter and search salons
  const filteredSalons = useMemo(() => {
    return salons.filter(salon => {
      // Status filter
      if (filterType === 'active' && !(salon.isActive !== false && salon.abonnement?.statut !== 'expire' && salon.abonnement?.statut !== 'suspendu')) {
        return false;
      }
      if (filterType === 'sponsored' && !(salon as any).isSponsored && !(salon as any).branding?.isSponsored) {
        return false;
      }
      if (filterType === 'no-gps' && salon.location?.lat && salon.location?.lng) {
        return false;
      }
      if (filterType === 'expired' && salon.isActive !== false && salon.abonnement?.statut !== 'expire' && salon.abonnement?.statut !== 'suspendu') {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const name = (salon.name || salon.nom || '').toLowerCase();
        const city = (salon.ville || '').toLowerCase();
        const address = (salon.address || salon.adresse || '').toLowerCase();
        const email = (salon.email || '').toLowerCase();
        const phone = (salon.phone || '').toLowerCase();
        const ownerName = ((salon.owner as any)?.name || (salon as any).proprietaire?.name || '').toLowerCase();

        return name.includes(query) || city.includes(query) || address.includes(query) || email.includes(query) || phone.includes(query) || ownerName.includes(query);
      }

      return true;
    });
  }, [salons, filterType, searchTerm]);

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
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{t('admin.subtitle', 'Gestion complète des salons, coordonnées GPS, mise en avant & abonnements')}</p>
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
          <StatCard title="Sponsorisés (Featured)" value={sponsoredSalons.length} icon={Sparkles} variant="accent" />
          <StatCard title="Sans GPS" value={noGpsSalons.length} icon={MapPin} variant="warning" />
        </div>

        {/* Salon list */}
        <Card className="card-shadow">
          <CardHeader className="flex flex-col gap-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  {t('admin.registeredSalons', 'Salons enregistrés')}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {filteredSalons.length} sur {salons.length} {t('admin.salonsCount', 'salon(s)')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchSalons} className="text-xs h-9">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Actualiser
                </Button>
                <CreateSalonDialog
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  existingEmails={salons.map(s => s.email)}
                  onCreated={fetchSalons}
                />
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-border">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, ville, adresse, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <Button
                  size="sm"
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                  className="text-xs h-8 px-2.5"
                >
                  Tous ({salons.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilterType('active')}
                  className="text-xs h-8 px-2.5 text-emerald-600 border-emerald-500/30"
                >
                  Actifs ({activeSalonsCount})
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'sponsored' ? 'default' : 'outline'}
                  onClick={() => setFilterType('sponsored')}
                  className="text-xs h-8 px-2.5 text-amber-500 border-amber-500/30"
                >
                  ⭐ Sponsorisés ({sponsoredSalons.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'no-gps' ? 'default' : 'outline'}
                  onClick={() => setFilterType('no-gps')}
                  className="text-xs h-8 px-2.5 text-orange-500 border-orange-500/30"
                >
                  📍 Sans GPS ({noGpsSalons.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'expired' ? 'default' : 'outline'}
                  onClick={() => setFilterType('expired')}
                  className="text-xs h-8 px-2.5 text-destructive border-destructive/30"
                >
                  Inactifs / Expirés ({salons.length - activeSalonsCount})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
              </div>
            ) : filteredSalons.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm sm:text-base">
                  {searchTerm || filterType !== 'all' ? 'Aucun salon ne correspond à vos filtres' : t('admin.noSalons', 'Aucun salon enregistré')}
                </p>
                {searchTerm && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterType('all'); }} className="mt-2 text-xs text-primary">
                    Réinitialiser la recherche
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredSalons.map(salon => (
                  <SalonCard
                    key={salon._id || salon.id}
                    salon={salon}
                    onRenew={handleRenew}
                    onToggle={handleToggle}
                    onRefresh={fetchSalons}
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
