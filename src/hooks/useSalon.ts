import { useState, useCallback, useEffect } from 'react';
// import { Salon } from '@/types';
import { getStorageItem, setStorageItem, tenantStorageKey, STORAGE_KEYS } from '@/lib/storage';
import { defaultSalon } from '@/lib/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Salon, User } from '@/types';

export function useSalon() {
  const { session } = useAuth();
  const salonId = session?.salonId;

  const [salon, setSalon] = useState<Salon | null>(() => {
    try {
      const cached = localStorage.getItem('bf_active_salon');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── GET /api/salons/:id via api.getMySalon() ───────────────────────────────
  const fetchSalon = useCallback(async () => {
    if (!salonId) return;
    setLoading(true);
    setError(null);
    try {
      const [salonData, staffData] = await Promise.all([
        api.getMySalon(salonId),
        api.getStaff(salonId)
      ]);
      setSalon(salonData);
      setStaff(staffData);
      if (salonData) {
        try {
          localStorage.setItem('bf_active_salon', JSON.stringify(salonData));
          window.dispatchEvent(new CustomEvent('salon:updated', { detail: salonData }));
        } catch (e) {
          console.warn('Could not cache active salon:', e);
        }
      }
    } catch (err: any) {
      console.error('Error fetching salon/staff:', err);
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => { fetchSalon(); }, [fetchSalon]);

  // ── PUT /api/salons/:id via api.updateMySalon() ────────────────────────────
  const updateSalon = useCallback(async (updates: Partial<Salon>): Promise<Salon> => {
    if (!salonId) throw new Error('Non authentifié');
    const updated = await api.updateMySalon(salonId, updates);
    setSalon(prevSalon => {
      const merged = prevSalon ? { ...prevSalon, ...updated } : updated as Salon;
      try {
        localStorage.setItem('bf_active_salon', JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('salon:updated', { detail: merged }));
      } catch (e) {
        console.warn('Could not cache updated salon:', e);
      }
      return merged;
    });
    return updated;
  }, [salonId]);

  const updateConfigFidelite = useCallback((updates: Partial<Salon['configFidelite']>) => {
    setSalon(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        configFidelite: { ...prev.configFidelite, ...updates },
      };
      try {
        localStorage.setItem('bf_active_salon', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('salon:updated', { detail: updated }));
      } catch (e) {
        console.warn('Could not cache updated salon fidelite:', e);
      }
      return updated;
    });
  }, []);

  return { salon, staff, loading, error, updateSalon, updateConfigFidelite, refetch: fetchSalon };
}
