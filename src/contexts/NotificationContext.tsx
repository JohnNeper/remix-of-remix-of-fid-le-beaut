import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useStock } from '@/hooks/useStock';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useClients } from '@/hooks/useClients';
import { useSalon } from '@/hooks/useSalon';
import { useAuth } from '@/contexts/AuthContext';
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
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  stockAlertCount: number;
  rdvTodayCount: number;
  inactiveCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { produitsEnAlerte } = useStock();
  const { getRendezVousAujourdhui } = useRendezVous();
  const { getInactiveClients } = useClients();
  const { salon } = useSalon();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('bf_dismissed_notifs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('bf_read_notifs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [backendNotifications, setBackendNotifications] = useState<AppNotification[]>([]);

  // Sync dismissedIds to localStorage
  const updateDismissedIds = useCallback((updater: (prev: Set<string>) => Set<string>) => {
    setDismissedIds(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem('bf_dismissed_notifs', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  }, []);

  // Sync readIds to localStorage
  const updateReadIds = useCallback((updater: (prev: Set<string>) => Set<string>) => {
    setReadIds(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem('bf_read_notifs', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  }, []);

  const fetchBackendNotifications = useCallback(async () => {
    try {
      const hasToken = !!localStorage.getItem('bf_token');
      if (!session || !hasToken) {
        setBackendNotifications([]);
        return;
      }
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
  }, [session]);

  useEffect(() => {
    const hasToken = !!localStorage.getItem('bf_token');
    if (!session || !hasToken) {
      setBackendNotifications([]);
      return;
    }
    fetchBackendNotifications();
    const interval = setInterval(fetchBackendNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchBackendNotifications, session]);

  const rdvToday = useMemo(() => getRendezVousAujourdhui() || [], [getRendezVousAujourdhui]);
  const inactiveClients = useMemo(() => {
    if (!salon?.joursRappelInactivite) return [];
    return getInactiveClients(salon?.joursRappelInactivite || 30) || [];
  }, [getInactiveClients, salon?.joursRappelInactivite]);

  const notifications = useMemo(() => {
    const notifs: AppNotification[] = [];

    // Filter backend notifications by dismissedIds
    backendNotifications.forEach(n => {
      if (!dismissedIds.has(n.id)) {
        notifs.push(n);
      }
    });

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
    updateReadIds(prev => new Set([...prev, id]));
    if (!id.startsWith('stock-') && !id.startsWith('rdv-') && !id.startsWith('inactive-')) {
      setBackendNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      try {
        await api.markNotificationAsRead(id);
      } catch (err) {
        console.error("Error marking backend notification read:", err);
      }
    }
  }, [updateReadIds]);

  const markAllAsRead = useCallback(async () => {
    const allIds = notifications.map(n => n.id);
    updateReadIds(prev => new Set([...prev, ...allIds]));
    setBackendNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsAsRead();
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  }, [notifications, updateReadIds]);

  const deleteNotification = useCallback(async (id: string) => {
    updateDismissedIds(prev => new Set([...prev, id]));
    setBackendNotifications(prev => prev.filter(n => n.id !== id));
    if (!id.startsWith('stock-') && !id.startsWith('rdv-') && !id.startsWith('inactive-')) {
      try {
        await api.markNotificationAsRead(id);
      } catch (err) {
        console.error("Error deleting backend notification:", err);
      }
    }
  }, [updateDismissedIds]);

  const clearAll = useCallback(async () => {
    const allCurrentIds = notifications.map(n => n.id);
    updateDismissedIds(prev => new Set([...prev, ...allCurrentIds]));
    setBackendNotifications([]);
    try {
      await api.markAllNotificationsAsRead();
    } catch (err) {
      console.error("Error marking all backend notifications read:", err);
    }
  }, [notifications, updateDismissedIds]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
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
  markAllAsRead: () => {},
  deleteNotification: () => {},
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
