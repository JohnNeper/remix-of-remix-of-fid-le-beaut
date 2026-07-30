import { useState, useEffect, useCallback } from 'react';
import { api, ContactGroup, Campaign } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useCampaigns() {
  const { currentSalon } = useAuth();
  const salonId = currentSalon?.id || currentSalon?._id || '';

  const [groupes, setGroupes] = useState<ContactGroup[]>([]);
  const [campagnes, setCampagnes] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Groupes de contacts ────────────────────────────────────────────────────

  const fetchGroupes = useCallback(async () => {
    if (!salonId) return;
    try {
      const data = await api.getGroupesContacts(salonId);
      setGroupes(data);
    } catch (err) {
      console.error('[useCampaigns] fetchGroupes:', err);
    }
  }, [salonId]);

  const createGroupe = useCallback(async (
    payload: { nom: string; description?: string; couleur?: string; clients: string[] }
  ): Promise<ContactGroup | null> => {
    if (!salonId) return null;
    setLoading(true);
    try {
      const nouveau = await api.createGroupeContact(salonId, {
        salon: salonId,
        nom: payload.nom,
        description: payload.description,
        couleur: payload.couleur || '#8b5cf6',
        clients: payload.clients,
        type: 'manuel',
      });
      setGroupes(prev => [nouveau, ...prev]);
      toast.success('Groupe créé !', { description: `"${nouveau.nom}" avec ${payload.clients.length} contact(s)` });
      return nouveau;
    } catch (err: any) {
      toast.error('Erreur création groupe', { description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  const updateGroupe = useCallback(async (
    groupeId: string,
    updates: Partial<ContactGroup>
  ): Promise<ContactGroup | null> => {
    if (!salonId) return null;
    setLoading(true);
    try {
      const updated = await api.updateGroupeContact(salonId, groupeId, updates);
      setGroupes(prev => prev.map(g => g._id === groupeId ? updated : g));
      toast.success('Groupe mis à jour');
      return updated;
    } catch (err: any) {
      toast.error('Erreur mise à jour', { description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  const deleteGroupe = useCallback(async (groupeId: string) => {
    if (!salonId) return;
    try {
      await api.deleteGroupeContact(salonId, groupeId);
      setGroupes(prev => prev.filter(g => g._id !== groupeId));
      toast.success('Groupe supprimé');
    } catch (err: any) {
      toast.error('Erreur suppression', { description: err.message });
    }
  }, [salonId]);

  // ── Campagnes ──────────────────────────────────────────────────────────────

  const fetchCampagnes = useCallback(async () => {
    if (!salonId) return;
    try {
      const data = await api.getCampagnes(salonId);
      setCampagnes(data);
    } catch (err) {
      console.error('[useCampaigns] fetchCampagnes:', err);
    }
  }, [salonId]);

  const saveCampagne = useCallback(async (
    payload: { nom: string; message: string; groupes?: string[]; groupesPredefinies?: string[]; delaiEntreMessages?: number }
  ): Promise<Campaign | null> => {
    if (!salonId) return null;
    setLoading(true);
    try {
      const nouvelle = await api.createCampagne(salonId, {
        salon: salonId,
        nom: payload.nom,
        message: payload.message,
        groupes: payload.groupes || [],
        groupesPredefinies: payload.groupesPredefinies || [],
        delaiEntreMessages: payload.delaiEntreMessages || 30,
        statut: 'brouillon',
        stats: { total: 0, envoyes: 0, echecs: 0 },
      });
      setCampagnes(prev => [nouvelle, ...prev]);
      return nouvelle;
    } catch (err: any) {
      toast.error('Erreur sauvegarde campagne', { description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  const updateStats = useCallback(async (
    campagneId: string,
    stats: { envoyes?: number; echecs?: number; statut?: string }
  ) => {
    if (!salonId) return;
    try {
      const updated = await api.updateCampagneStats(salonId, campagneId, stats);
      setCampagnes(prev => prev.map(c => c._id === campagneId ? updated : c));
    } catch (err) {
      console.error('[useCampaigns] updateStats:', err);
    }
  }, [salonId]);

  useEffect(() => {
    fetchGroupes();
    fetchCampagnes();
  }, [fetchGroupes, fetchCampagnes]);

  return {
    groupes,
    campagnes,
    loading,
    createGroupe,
    updateGroupe,
    deleteGroupe,
    saveCampagne,
    updateStats,
    refreshGroupes: fetchGroupes,
    refreshCampagnes: fetchCampagnes,
  };
}
