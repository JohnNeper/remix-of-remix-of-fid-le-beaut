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
  BookOpen,
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
import { useSalon } from '@/hooks/useSalon';
import { ContactUpgradeDialog } from '../ui/ContactUpgradeDialog';
import { FloatingTourButton } from '@/components/dashboard/FloatingTourButton';
import { GuidedTourPopover } from '@/components/dashboard/GuidedTourPopover';
import { useOnboardingTour } from '@/contexts/OnboardingTourContext';

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
  const { isTourActive, currentStep } = useOnboardingTour();

  const isActive = location.pathname === item.href;
  const isTargetedStep = isTourActive && currentStep && currentStep.route === item.href;
  const Icon = item.icon;

  const badgeCount = item.badgeKey === 'stock' ? stockAlertCount
    : item.badgeKey === 'rdv' ? rdvTodayCount
      : item.badgeKey === 'inactive' ? inactiveCount
        : 0;

  const stepNumberLabel = isTargetedStep
    ? currentStep.stepNumber === 1 ? '① Étape 1'
      : currentStep.stepNumber === 2 ? '② Étape 2'
      : currentStep.stepNumber === 3 ? '③ Étape 3'
      : currentStep.stepNumber === 4 ? '④ Étape 4'
      : currentStep.stepNumber === 5 ? '⑤ Étape 5'
      : '⑥ Étape 6'
    : null;

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        isTargetedStep && !isActive && 'ring-2 ring-amber-400 bg-amber-400/10 text-foreground font-extrabold shadow-md animate-pulse'
      )}
    >
      <Icon className={cn("h-5 w-5", isTargetedStep && "text-amber-500 animate-bounce")} />
      <span className="font-medium flex-1">{t(item.labelKey)}</span>

      {isTargetedStep && (
        <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 border-0 shadow-sm animate-pulse shrink-0">
          {stepNumberLabel}
        </Badge>
      )}

      {!isTargetedStep && badgeCount > 0 && (
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

function Sidebar({ className, onItemClick, onUpgradeClick }: { className?: string; onItemClick?: () => void; onUpgradeClick?: () => void }) {
  const { logout, session } = useAuth();
  const { salon } = useSalon();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { getUpgradePlan } = useSubscriptionPlan();

  const nextPlan = getUpgradePlan();
  const upgradeLabel = nextPlan?.name === 'premium' ? t('nav.upgradeToPremium') : t('nav.upgradeToPro');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={cn('flex flex-col h-full bg-sidebar', className)}>
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border ios-sidebar-logo-pt">
        <Link to="/" className="flex items-center gap-3 group">
          {salon?.logoUrl ? (
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center overflow-hidden border border-border/60 bg-background shadow-xs">
              <img src={salon.logoUrl} alt={salon?.nom || 'Logo'} className="h-full w-full object-cover" />
            </div>
          ) : (
            <img src={bfLogo} alt="BeautyFlow" className="h-9 object-contain shrink-0 drop-shadow-xs" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-base text-sidebar-foreground leading-tight truncate group-hover:text-primary transition-colors">
              {salon?.nom || (salon as any)?.name || 'Mon Salon'}
            </h1>
            {salon?.slogan ? (
              <p className="text-[10px] text-muted-foreground truncate">{salon.slogan}</p>
            ) : (
              <p className="text-[10px] font-bold text-rose-500">BeautyFlow Pro</p>
            )}
          </div>
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
              if (onUpgradeClick) onUpgradeClick();
              if (onItemClick) onItemClick();
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
  const { currentSalon, session } = useAuth();
  const { salon } = useSalon();
  const { language, t } = useLanguage();
  const { getUpgradePlan } = useSubscriptionPlan();
  const nextPlan = getUpgradePlan();
  const upgradeLabel = nextPlan?.name === 'premium' ? t('nav.upgradeToPremium') : t('nav.upgradeToPro');

  const { openTourModal } = useOnboardingTour();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const salonName = salon?.nom || (currentSalon as any)?.name || 'Mon Salon';

  // Calculate remaining days for abonnement warning
  const daysLeft = React.useMemo(() => {
    if (!salon?.abonnement?.dateFin) return null;
    const fin = new Date(salon.abonnement.dateFin);
    const diff = fin.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [salon]);

  const showBanner = daysLeft !== null && daysLeft > 0 && daysLeft <= 14 && !bannerDismissed;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - hidden on mobile devices */}
      {!isMobile && (
        <div className="hidden lg:block w-64 border-r border-border fixed inset-y-0 left-0 z-30">
          <Sidebar onUpgradeClick={() => setIsUpgradeModalOpen(true)} />
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border ios-header-pt shadow-xs">
        <div className="flex items-center justify-between p-3.5 sm:p-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            {salon?.logoUrl ? (
              <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center overflow-hidden border border-border/60 bg-card">
                <img src={salon.logoUrl} alt={salonName} className="h-full w-full object-cover" />
              </div>
            ) : (
              <img src={bfLogo} alt="BeautyFlow" className="h-7 object-contain shrink-0" />
            )}
          </Link>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10 h-8 text-[11px] font-bold rounded-full px-2.5 shadow-xs"
              onClick={() => openTourModal(0)}
              title="Ouvrir le guide Premiers Pas"
            >
              <BookOpen className="h-3 w-3 mr-1 text-amber-500 shrink-0" />
              <span>Guide 💡</span>
            </Button>
            {nextPlan && (
              <Button
                size="sm"
                variant="outline"
                className="text-primary border-primary/30 hover:bg-primary/10 h-8 text-[11px] font-bold rounded-full px-2.5 shadow-sm mr-1"
                onClick={() => setIsUpgradeModalOpen(true)}
              >
                <Sparkles className="h-3 w-3 mr-1 text-primary shrink-0" />
                <span className="truncate">{upgradeLabel}</span>
              </Button>
            )}
            <LanguageToggle />
            <NotificationCenter />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <Sidebar onItemClick={() => setMobileMenuOpen(false)} onUpgradeClick={() => setIsUpgradeModalOpen(true)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop top bar */}
      {!isMobile && (
        <div className="hidden lg:flex fixed top-0 left-64 right-0 z-20 h-14 bg-card border-b border-border items-center justify-end px-6 gap-3">
          <Button
            size="sm"
            variant="outline"
            className="text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 h-8 text-xs font-bold rounded-full px-3 shadow-xs flex items-center gap-1.5"
            onClick={() => openTourModal(0)}
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-500" />
            <span>Premiers Pas 💡</span>
          </Button>
          {nextPlan && (
            <Button
              size="sm"
              variant="outline"
              className="text-primary border-primary/30 hover:bg-primary/10 h-8 text-xs font-bold rounded-full px-3 shadow-sm"
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
              {upgradeLabel}
            </Button>
          )}
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
                  onClick={() => setIsUpgradeModalOpen(true)}
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

      {/* Global Interactive Subscription Upgrade & Renewal Modal */}
      <ContactUpgradeDialog
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
        requiredPlan={nextPlan}
      />

      {/* Floating Tour Action Button & Interactive Step Popover */}
      <FloatingTourButton />
      <GuidedTourPopover />
    </div>
  );
}
