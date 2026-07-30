import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RendezVous } from '@/types/rendez-vous';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function normalizeRendezVous(item: any): RendezVous {
  return {
    ...item,
    id: item._id || item.id,
    clientId: typeof item.client === 'object' ? item.client?._id || item.client?.id : item.client || item.clientId || '',
    typePrestationId: typeof item.typePrestation === 'object' ? item.typePrestation?._id || item.typePrestation?.id : item.typePrestation || item.typePrestationId || '',
    date: item.date || '',
    heure: item.heure || '09:00',
    duree: item.duree || 60,
    employe: typeof item.employe === 'object' ? item.employe?.name || item.employe?._id : item.employe,
    notes: item.notes || '',
    statut: item.statut || 'en_attente',
    source: item.source || 'salon',
  };
}

export function useRendezVous() {
  const { session } = useAuth();
  const salonId = session?.salonId;
  const queryClient = useQueryClient();

  // Query: Lister tous les rendez-vous du salon
  const { data: rendezVous = [], isLoading: loading } = useQuery<RendezVous[]>({
    queryKey: ['rendezVous', salonId],
    queryFn: async () => {
      if (!salonId) return [];
      try {
        const data = await api.getRendezVous(salonId);
        return (data || []).map(normalizeRendezVous);
      } catch (err) {
        console.error('Erreur lors du chargement des rendez-vous:', err);
        return [];
      }
    },
    enabled: !!salonId,
  });

  // Mutation: Ajouter un rendez-vous
  const addRendezVousMutation = useMutation({
    mutationFn: async (rdv: Omit<RendezVous, 'id'>) => {
      if (!salonId) throw new Error('Salon non identifié');
      const payload = {
        ...rdv,
        client: rdv.clientId,
        typePrestation: rdv.typePrestationId,
      };
      const res = await api.createRendezVous(salonId, payload as any);
      return normalizeRendezVous(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', salonId] });
    },
  });

  // Mutation: Mettre à jour un rendez-vous
  const updateRendezVousMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RendezVous> }) => {
      if (!salonId) throw new Error('Salon non identifié');
      const payload: any = { ...updates };
      if (updates.clientId) payload.client = updates.clientId;
      if (updates.typePrestationId) payload.typePrestation = updates.typePrestationId;

      const res = await api.updateRendezVous(salonId, id, payload);
      return normalizeRendezVous(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', salonId] });
    },
  });

  // Mutation: Supprimer un rendez-vous
  const deleteRendezVousMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!salonId) throw new Error('Salon non identifié');
      await api.deleteRendezVous(salonId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', salonId] });
    },
  });

  const addRendezVous = useCallback(
    async (rdv: Omit<RendezVous, 'id'>) => {
      return await addRendezVousMutation.mutateAsync(rdv);
    },
    [addRendezVousMutation]
  );

  const updateRendezVous = useCallback(
    (args: { id: string; updates: Partial<RendezVous> } | string, legacyUpdates?: Partial<RendezVous>) => {
      if (typeof args === 'object' && args !== null) {
        updateRendezVousMutation.mutate(args);
      } else if (typeof args === 'string' && legacyUpdates) {
        updateRendezVousMutation.mutate({ id: args, updates: legacyUpdates });
      }
    },
    [updateRendezVousMutation]
  );

  const deleteRendezVous = useCallback(
    (id: string) => {
      deleteRendezVousMutation.mutate(id);
    },
    [deleteRendezVousMutation]
  );

  const getRendezVousByDate = useCallback(
    (date: string) => {
      return rendezVous.filter((r) => r.date === date).sort((a, b) => (a.heure || '').localeCompare(b.heure || ''));
    },
    [rendezVous]
  );

  const getRendezVousAujourdhui = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return getRendezVousByDate(today);
  }, [getRendezVousByDate]);

  const getDatesAvecRendezVous = useCallback(() => {
    return Array.from(new Set(rendezVous.map((r) => r.date)));
  }, [rendezVous]);

  return {
    rendezVous,
    loading,
    addRendezVous,
    updateRendezVous,
    deleteRendezVous,
    getRendezVousByDate,
    getRendezVousAujourdhui,
    getDatesAvecRendezVous,
  };
}
