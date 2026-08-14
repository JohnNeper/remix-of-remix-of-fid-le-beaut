import React, { useState } from 'react';
import { Bell, Package, Calendar, Users, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  stock: Package,
  rdv: Calendar,
  inactive: Users,
  info: Bell,
};

const typeColors: Record<string, string> = {
  stock: 'text-destructive bg-destructive/10',
  rdv: 'text-info bg-info/10',
  inactive: 'text-warning bg-warning/10',
  info: 'text-muted-foreground bg-muted',
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll, permissionState, requestPermission } = useNotifications();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const getNotifDisplay = (notif: typeof notifications[0]) => {
    if (!notif) return { title: '', desc: '' };

    const isLocalStock = typeof notif.id === 'string' && notif.id.startsWith('stock-');
    const isLocalRdv = notif.id === 'rdv-today';
    const isLocalInactive = notif.id === 'inactive-clients';

    if (notif.type === 'stock' && isLocalStock) {
      const parts = (notif.description || '').split('/');
      return {
        title: t('notifications.stockAlert'),
        desc: t('notifications.stockAlertDesc', {
          name: notif.title || '',
          qty: parts[0] || '0',
          threshold: parts[1] || '0',
        }),
      };
    }

    if (notif.type === 'rdv' && isLocalRdv) {
      return {
        title: t('notifications.todayRdv'),
        desc: t('notifications.todayRdvDesc', { count: notif.title || '0' }),
      };
    }

    if (notif.type === 'inactive' && isLocalInactive) {
      return {
        title: t('notifications.inactiveAlert'),
        desc: t('notifications.inactiveAlertDesc', { count: notif.title || '0', days: notif.description || '0' }),
      };
    }

    return { title: notif.title || '', desc: notif.description || '' };
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl border-border/80" align="end">
        <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/30">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            {t('notifications.title')}
          </h3>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={clearAll}>
              <Trash2 className="h-3 w-3 mr-1" />
              {t('notifications.clearAll')}
            </Button>
          )}
        </div>

        {permissionState === 'default' && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300 leading-tight">
              Activer les notifications système sur cet appareil ?
            </p>
            <Button
              size="sm"
              onClick={() => requestPermission()}
              className="h-6 px-2 text-[10px] font-bold rounded-lg gradient-primary shrink-0"
            >
              Activer
            </Button>
          </div>
        )}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map(notif => {
                const Icon = (notif?.type && typeIcons[notif.type]) || Bell;
                const colorClass = (notif?.type && typeColors[notif.type]) || 'text-muted-foreground bg-muted';
                const display = getNotifDisplay(notif);
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'group relative flex items-start gap-3 p-3 transition-colors hover:bg-muted/60 cursor-pointer',
                      !notif.read && 'bg-primary/5'
                    )}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={cn('text-xs font-bold leading-snug', !notif.read ? 'text-foreground' : 'text-muted-foreground')}>
                        {display.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{display.desc}</p>
                    </div>
                    
                    {/* Delete Individual Notification Button */}
                    <button
                      type="button"
                      className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-80 group-hover:opacity-100"
                      title={t('common.delete')}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    {!notif.read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
