import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Scissors,
  Bell,
  Settings,
  Menu,
  Gift,
  MessageSquare,
  Sparkles,
  CalendarDays,
  Package,
  DollarSign,
  LogOut,
  ShoppingCart,
  BarChart3,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import bfLogo from '@/assets/BF.png';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  badgeKey?: 'stock' | 'rdv' | 'inactive';
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/clientes', labelKey: 'nav.clients', icon: Users },
  { href: '/prestations', labelKey: 'nav.services', icon: Scissors },
  { href: '/rendez-vous', labelKey: 'nav.appointments', icon: CalendarDays, badgeKey: 'rdv' },
  { href: '/stock', labelKey: 'nav.stock', icon: Package, badgeKey: 'stock' },
  // Caisse du jour — accessible au staff uniquement
  { href: '/caisse', labelKey: 'nav.caisse', icon: ShoppingCart, roles: ['staff'] },
  // Finances complètes — owner & admin uniquement
  { href: '/finances', labelKey: 'nav.finances', icon: DollarSign, roles: ['owner', 'admin'] },
  { href: '/bilan', labelKey: 'nav.bilan', icon: BarChart3, roles: ['owner', 'admin'] },
  { href: '/fidelite', labelKey: 'nav.loyalty', icon: Gift, roles: ['owner', 'admin', 'staff'] },
  { href: '/rappels', labelKey: 'nav.reminders', icon: Bell, badgeKey: 'inactive' },
  // { href: '/campagnes', labelKey: 'nav.campaigns', icon: MessageSquare, roles: ['owner', 'staff', 'admin'] },
  { href: '/parametres', labelKey: 'nav.settings', icon: Settings, roles: ['owner', 'admin'] },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const location = useLocation();
  const { t } = useLanguage();
  const { stockAlertCount, rdvTodayCount, inactiveCount } = useNotifications();
  const isActive = location.pathname === item.href;
  const Icon = item.icon;

  const badgeCount = item.badgeKey === 'stock' ? stockAlertCount
    : item.badgeKey === 'rdv' ? rdvTodayCount
      : item.badgeKey === 'inactive' ? inactiveCount
        : 0;

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium flex-1">{t(item.labelKey)}</span>
      {badgeCount > 0 && (
        <Badge
          className={cn(
            'h-5 min-w-[20px] px-1.5 text-[10px] font-bold flex items-center justify-center',
            isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-destructive text-destructive-foreground'
          )}
        >
          {badgeCount}
        </Badge>
      )}
    </Link>
  );
}

function Sidebar({ className, onItemClick }: { className?: string; onItemClick?: () => void }) {
  const { logout, currentSalon, session } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { plan: currentPlan, getUpgradePlan } = useSubscriptionPlan();

  const nextPlan = getUpgradePlan();
  const upgradeLabel = nextPlan?.name === 'premium' ? t('nav.upgradeToPremium') : t('nav.upgradeToPro');
  const upgradeMsg = t(nextPlan?.name === 'premium' ? 'nav.upgradeMsgPremium' : 'nav.upgradeMsgPro', {
    name: currentSalon?.name || ''
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={cn('flex flex-col h-full bg-sidebar', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border ios-sidebar-logo-pt">
        <Link to="/" className="flex items-center gap-3">
          {currentSalon?.logoUrl ? (
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center overflow-hidden border border-border/50">
              <img src={currentSalon.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            </div>
          ) : (
            <img src={bfLogo} alt="BeautyFlow" className="h-10 object-contain drop-shadow-sm shrink-0 max-w-[160px]" />
          )}
          {currentSalon?.name && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base text-sidebar-foreground leading-tight truncate">
                {currentSalon.name}
              </h1>
              {currentSalon.slogan && (
                <p className="text-[10px] text-muted-foreground truncate">{currentSalon.slogan}</p>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter(item => !item.roles || (session?.userRole && item.roles.includes(session.userRole)))
          .map((item) => (
            <NavLink key={item.href} item={item} onClick={onItemClick} />
          ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {nextPlan && (
          <Button
            variant="outline"
            className="w-full justify-start text-primary border-primary/20 hover:bg-primary/5 font-semibold"
            onClick={() => {
              window.open(`https://wa.me/237658315610?text=${encodeURIComponent(upgradeMsg)}`, '_blank');
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {upgradeLabel}
          </Button>
        )}
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          {t('nav.logout')}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Powered by BeautyFlow © 2026
        </p>
      </div>
    </aside>
  );
}

export default function AppLayout() {
  const { currentSalon } = useAuth();
  const { language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isMobile = useIsMobile();

  // Calculate remaining days for abonnement warning
  const daysLeft = React.useMemo(() => {
    if (!currentSalon?.abonnement?.dateFin) return null;
    const fin = new Date(currentSalon.abonnement.dateFin);
    const diff = fin.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [currentSalon]);

  const showBanner = daysLeft !== null && daysLeft > 0 && daysLeft <= 14 && !bannerDismissed;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - hidden on mobile devices */}
      {!isMobile && (
        <div className="hidden lg:block w-64 border-r border-border fixed inset-y-0 left-0 z-30">
          <Sidebar />
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border ios-header-pt">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            {currentSalon?.logoUrl ? (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden border border-border/50">
                <img src={currentSalon.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              </div>
            ) : (
              <img src={bfLogo} alt="BeautyFlow" className="h-7 object-contain max-w-[120px]" />
            )}
            {currentSalon?.name && (
              <span className="font-bold text-foreground text-sm truncate max-w-[120px]">{currentSalon.name}</span>
            )}
          </Link>

          <div className="flex items-center gap-1">
            <LanguageToggle />
            <NotificationCenter />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <Sidebar onItemClick={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop top bar */}
      {!isMobile && (
        <div className="hidden lg:flex fixed top-0 left-64 right-0 z-20 h-14 bg-card border-b border-border items-center justify-end px-6 gap-2">
          <LanguageToggle />
          <NotificationCenter />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="pt-16 ios-main-pt lg:!pt-14 min-h-screen flex flex-col">
          {showBanner && (
            <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2.5 text-sm text-amber-800 dark:text-amber-400 font-medium">
                <Sparkles className="h-5 w-5 text-amber-600 animate-pulse shrink-0" />
                <span>
                  {language === 'fr'
                    ? `Attention : Votre abonnement BeautyFlow expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}. Pensez à le renouveler pour ne pas perdre l'accès à vos outils !`
                    : `Warning: Your BeautyFlow subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew it now to avoid losing access to your tools!`}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 h-8 text-xs font-semibold rounded-lg"
                  onClick={() => {
                    const upgradeMsg = language === 'fr'
                      ? `Bonjour, je souhaite renouveler l'abonnement de mon salon ${currentSalon?.name}`
                      : `Hello, I would like to renew the subscription for my salon ${currentSalon?.name}`;
                    window.open(`https://wa.me/237658315610?text=${encodeURIComponent(upgradeMsg)}`, '_blank');
                  }}
                >
                  {language === 'fr' ? 'Renouveler' : 'Renew'}
                </Button>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="text-amber-700/60 hover:text-amber-800 dark:text-amber-400/60 dark:hover:text-amber-300 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
