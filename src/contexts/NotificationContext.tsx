import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useStock } from '@/hooks/useStock';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useClients } from '@/hooks/useClients';
import { useSalon } from '@/hooks/useSalon';
import { api } from '@/lib/api';

export interface AppNotification {
  id: string;
  type: 'stock' | 'rdv' | 'inactive' | 'info';
  title: string;
  description: string;
  read: boolean;
  timestamp: number;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  stockAlertCount: number;
  rdvTodayCount: number;
  inactiveCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { produitsEnAlerte } = useStock();
  const { getRendezVousAujourdhui } = useRendezVous();
  const { getInactiveClients } = useClients();
  const { salon } = useSalon();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [backendNotifications, setBackendNotifications] = useState<AppNotification[]>([]);

  const fetchBackendNotifications = useCallback(async () => {
    try {
      if (typeof api?.getNotifications !== 'function') return;
      const data = await api.getNotifications();
      if (!data) return;
      const list = Array.isArray(data) ? data : (data as any)?.data;
      if (!Array.isArray(list)) return;
      const mapped: AppNotification[] = list.map((n: any) => ({
        id: n._id || n.id || `notif-${Math.random()}`,
        type: n.type === 'booking' ? 'rdv' : (n.type || 'info'),
        title: n.title || '',
        description: n.description || '',
        read: !!n.read,
        timestamp: new Date(n.timestamp || n.createdAt || Date.now()).getTime(),
      }));
      setBackendNotifications(mapped);
    } catch (err) {
      console.error("Error fetching backend notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchBackendNotifications();
    const interval = setInterval(fetchBackendNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchBackendNotifications]);

  const rdvToday = useMemo(() => getRendezVousAujourdhui() || [], [getRendezVousAujourdhui]);
  const inactiveClients = useMemo(() => {
    if (!salon?.joursRappelInactivite) return [];
    return getInactiveClients(salon?.joursRappelInactivite || 30) || [];
  }, [getInactiveClients, salon?.joursRappelInactivite]);

  const notifications = useMemo(() => {
    const notifs: AppNotification[] = [...backendNotifications];

    // Stock alerts
    (produitsEnAlerte || []).forEach(p => {
      const id = `stock-${p.id}`;
      if (!dismissedIds.has(id)) {
        notifs.push({
          id,
          type: 'stock',
          title: p.nom,
          description: `${p.quantite}/${p.seuilAlerte}`,
          read: readIds.has(id),
          timestamp: Date.now(),
        });
      }
    });

    // Today's RDV
    if (rdvToday.length > 0) {
      const id = `rdv-today`;
      if (!dismissedIds.has(id)) {
        notifs.push({
          id,
          type: 'rdv',
          title: `${rdvToday.length}`,
          description: 'today',
          read: readIds.has(id),
          timestamp: Date.now(),
        });
      }
    }

    // Inactive clients
    if (inactiveClients.length > 0) {
      const id = `inactive-clients`;
      if (!dismissedIds.has(id)) {
        notifs.push({
          id,
          type: 'inactive',
          title: `${inactiveClients.length}`,
          description: `${salon?.joursRappelInactivite || 30}`,
          read: readIds.has(id),
          timestamp: Date.now(),
        });
      }
    }

    return notifs.sort((a, b) => b.timestamp - a.timestamp);
  }, [backendNotifications, produitsEnAlerte, rdvToday, inactiveClients, dismissedIds, readIds, salon?.joursRappelInactivite]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    if (!id.startsWith('stock-') && !id.startsWith('rdv-') && !id.startsWith('inactive-')) {
      // Backend notification
      setBackendNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      try {
        await api.markNotificationAsRead(id);
      } catch (err) {
        console.error("Error marking backend notification read:", err);
      }
    } else {
      // Local notification
      setReadIds(prev => new Set([...prev, id]));
    }
  }, []);

  const clearAll = useCallback(async () => {
    setDismissedIds(prev => new Set([...prev, ...notifications.map(n => n.id)]));
    setBackendNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsAsRead();
    } catch (err) {
      console.error("Error marking all backend notifications read:", err);
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      clearAll,
      stockAlertCount: (produitsEnAlerte || []).length,
      rdvTodayCount: (rdvToday || []).length,
      inactiveCount: (inactiveClients || []).length,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

const defaultContextValue: NotificationContextType = {
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  clearAll: () => {},
  stockAlertCount: 0,
  rdvTodayCount: 0,
  inactiveCount: 0,
};

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    console.warn('useNotifications was used outside of NotificationProvider or context was lost.');
    return defaultContextValue;
  }
  return ctx;
}
