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

  const [salon, setSalon] = useState<Salon | null>(null);
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
    setSalon(prevSalon => prevSalon ? { ...prevSalon, ...updated } : updated as Salon);
    return updated;
  }, [salonId]);

  const updateConfigFidelite = useCallback((updates: Partial<Salon['configFidelite']>) => {
    setSalon(prev => ({
      ...prev,
      configFidelite: { ...prev.configFidelite, ...updates },
    }));
  }, []);

  return { salon, staff, loading, error, updateSalon, updateConfigFidelite, refetch: fetchSalon };
}
