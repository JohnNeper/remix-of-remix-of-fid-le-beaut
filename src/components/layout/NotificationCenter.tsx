import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Package, Calendar, Users, Check, CheckCheck, Trash2, X, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  stock: Package,
  rdv: Calendar,
  inactive: Users,
  info: Bell,
};

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  stock: {
    bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
  },
  rdv: {
    bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  inactive: {
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
  },
  info: {
    bg: 'bg-primary/10 text-primary',
    text: 'text-primary',
    border: 'border-primary/20',
  },
};

function formatRelativeTime(timestamp?: number, isFr = true): string {
  if (!timestamp) return isFr ? 'Récemment' : 'Recently';
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 2) return isFr ? "À l'instant" : 'Just now';
  if (diffMinutes < 60) return isFr ? `Il y a ${diffMinutes} min` : `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return isFr ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
  return isFr ? 'Aujourd’hui' : 'Today';
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    permissionState,
    requestPermission,
  } = useNotifications();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isFr = language === 'fr';

  const getDestination = (notif: AppNotification) => {
    const type: string = notif.type || '';
    const titleLower = (notif.title || '').toLowerCase();
    const descLower = (notif.description || '').toLowerCase();
    const combined = `${titleLower} ${descLower}`;

    if (
      type === 'stock' ||
      notif.id.startsWith('stock-') ||
      combined.includes('stock') ||
      combined.includes('rupture') ||
      combined.includes('produit')
    ) {
      return { path: '/stock', label: isFr ? 'Accéder au Stock' : 'Open Inventory', color: 'text-rose-600 dark:text-rose-400' };
    }
    if (
      type === 'rdv' ||
      type === 'booking' ||
      notif.id.startsWith('rdv') ||
      combined.includes('rendez-vous') ||
      combined.includes('rdv') ||
      combined.includes('réservation') ||
      combined.includes('planning') ||
      combined.includes('créneau')
    ) {
      return { path: '/rendez-vous', label: isFr ? 'Consulter le Planning' : 'View Schedule', color: 'text-blue-600 dark:text-blue-400' };
    }
    if (
      type === 'inactive' ||
      notif.id.startsWith('inactive') ||
      combined.includes('relance') ||
      combined.includes('inactiv') ||
      combined.includes('rappel') ||
      combined.includes('cliente')
    ) {
      return { path: '/rappels', label: isFr ? 'Relancer les Clientes' : 'Remind Clients', color: 'text-amber-600 dark:text-amber-400' };
    }
    if (
      type === 'paiement' ||
      type === 'vente' ||
      combined.includes('vente') ||
      combined.includes('factur') ||
      combined.includes('bilan') ||
      combined.includes('chiffre')
    ) {
      return { path: '/bilan', label: isFr ? 'Voir le Bilan Boss' : 'View Reports', color: 'text-emerald-600 dark:text-emerald-400' };
    }
    return { path: '/rendez-vous', label: isFr ? 'Consulter' : 'View', color: 'text-primary' };
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setOpen(false);
    const dest = getDestination(notif);
    navigate(dest.path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl hover:bg-accent transition-colors"
          aria-label="Centre de notifications"
        >
          <Bell className="h-5 w-5 text-foreground/80" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-background animate-pulse shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-24px)] max-w-sm sm:w-96 p-0 rounded-3xl shadow-2xl border-border/80 bg-background/95 backdrop-blur-xl flex flex-col overflow-hidden z-50"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground leading-tight">
                {t('notifications.title') || 'Notifications'}
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                {unreadCount > 0
                  ? isFr
                    ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                    : `${unreadCount} unread`
                  : isFr
                  ? 'Toutes les alertes sont à jour'
                  : 'Up to date'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground rounded-lg"
                onClick={() => markAllAsRead()}
                title={isFr ? 'Tout marquer comme lu' : 'Mark all as read'}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                <span className="hidden sm:inline">{isFr ? 'Tout lire' : 'Read all'}</span>
              </Button>
            )}

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                onClick={clearAll}
                title={t('notifications.clearAll') || 'Tout effacer'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Browser Native Permission Banner */}
        {permissionState === 'default' && (
          <div className="p-3 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-b border-amber-500/25 flex items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-tight">
                {isFr ? 'Activer les alertes sur cet appareil ?' : 'Enable device notifications?'}
              </p>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                {isFr ? 'Recevez les RDV et alertes même écran fermé.' : 'Get live salon alerts on your lock screen.'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => requestPermission()}
              className="h-7 px-3 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-xs"
            >
              {isFr ? 'Activer' : 'Enable'}
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea className="max-h-80 sm:max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground/40">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-sm font-extrabold text-foreground">
                {isFr ? 'Aucune nouvelle notification' : 'No new notifications'}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {isFr
                  ? 'Vos alertes de stock, rendez-vous du jour et clientes inactives apparaîtront ici.'
                  : 'Your inventory alerts, today appointments and reminders will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((notif) => {
                const Icon = (notif?.type && typeIcons[notif.type]) || Bell;
                const colors = (notif?.type && typeColors[notif.type]) || typeColors.info;
                const relativeTime = formatRelativeTime(notif.timestamp, isFr);
                const dest = getDestination(notif);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      'group relative flex items-start gap-3 p-3.5 transition-all hover:bg-muted/60 cursor-pointer active:scale-[0.99]',
                      !notif.read ? 'bg-primary/5 dark:bg-primary/10' : 'opacity-85'
                    )}
                  >
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border transition-transform group-hover:scale-105', colors.bg, colors.border)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn('text-xs font-black leading-snug', !notif.read ? 'text-foreground' : 'text-muted-foreground')}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                          {relativeTime}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed font-medium">
                        {notif.description}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={cn('inline-flex items-center gap-1 text-[11px] font-black tracking-tight group-hover:underline', dest.color)}>
                          {dest.label}
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>

                    {/* Delete Individual Notification Button */}
                    <button
                      type="button"
                      className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-70 group-hover:opacity-100"
                      title={t('common.delete') || 'Supprimer'}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    {!notif.read && (
                      <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0 mt-2 shadow-xs" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer Shortcut to Reminders */}
        <div className="p-2.5 bg-muted/40 border-t border-border/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/rappels');
            }}
            className="w-full py-1.5 px-3 rounded-xl hover:bg-background text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>{isFr ? 'Gérer tous les rappels & relances' : 'Manage all reminders'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
