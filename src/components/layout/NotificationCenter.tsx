import React from 'react';
import { Bell, Package, Calendar, Users, Check, Trash2 } from 'lucide-react';
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
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const { t } = useLanguage();

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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm">{t('notifications.title')}</h3>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearAll}>
              <Trash2 className="h-3 w-3 mr-1" />
              {t('notifications.clearAll')}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(notif => {
                const Icon = (notif?.type && typeIcons[notif.type]) || Bell;
                const colorClass = (notif?.type && typeColors[notif.type]) || 'text-muted-foreground bg-muted';
                const display = getNotifDisplay(notif);
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer',
                      !notif.read && 'bg-primary/5'
                    )}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', !notif.read && 'text-foreground')}>
                        {display.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{display.desc}</p>
                    </div>
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
