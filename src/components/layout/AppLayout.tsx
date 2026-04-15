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

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  badgeKey?: 'stock' | 'rdv' | 'inactive';
}

const navItems: NavItem[] = [
  { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/clientes', labelKey: 'nav.clients', icon: Users },
  { href: '/prestations', labelKey: 'nav.services', icon: Scissors },
  { href: '/rendez-vous', labelKey: 'nav.appointments', icon: CalendarDays, badgeKey: 'rdv' },
  { href: '/stock', labelKey: 'nav.stock', icon: Package, badgeKey: 'stock' },
  { href: '/finances', labelKey: 'nav.finances', icon: DollarSign },
  { href: '/fidelite', labelKey: 'nav.loyalty', icon: Gift },
  { href: '/rappels', labelKey: 'nav.reminders', icon: Bell, badgeKey: 'inactive' },
  { href: '/campagnes', labelKey: 'nav.campaigns', icon: MessageSquare },
  { href: '/parametres', labelKey: 'nav.settings', icon: Settings },
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
  const { logout, currentSalon } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={cn('flex flex-col h-full bg-sidebar', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground leading-tight">
              {currentSalon?.nom || 'LeaderBright'}
            </h1>
            <p className="text-xs text-muted-foreground">BeautyFlow</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onItemClick} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          {t('nav.logout')}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          © 2025 LeaderBright
        </p>
      </div>
    </aside>
  );
}

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 border-r border-border fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-foreground">BeautyFlow</span>
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

      {/* Desktop top bar with language toggle + notifications */}
      <div className="hidden lg:flex fixed top-0 left-64 right-0 z-20 h-14 bg-card border-b border-border items-center justify-end px-6 gap-2">
        <LanguageToggle />
        <NotificationCenter />
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <div className="pt-16 lg:pt-14 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
