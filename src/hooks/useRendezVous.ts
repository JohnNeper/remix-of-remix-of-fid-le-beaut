import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RendezVous } from '@/types/rendez-vous';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { sendNativeNotification } from '@/lib/webNotifications';

function normalizeRendezVous(item: any): RendezVous {
  const isTermine = item.statut === 'termine' || item.statut === 'completed';
  const hasFinance = Boolean(item.financeValide || item.vente || item.venteId);
  return {
    ...item,
    id: item._id || item.id,
    clientId: typeof item.client === 'object' ? item.client?._id || item.client?.id : item.client || item.clientId || '',
    typePrestationId: typeof item.typePrestation === 'object' ? item.typePrestation?._id || item.typePrestation?.id : item.typePrestation || item.typePrestationId || '',
    date: item.date || '',
    heure: item.heure || '09:00',
    duree: item.duree || 60,
    employe: typeof item.employe === 'object' ? item.employe?.name || item.employe?._id : item.employe,
    employeNom: typeof item.employe === 'object' ? item.employe?.name : (item.employeNom || item.employe),
    notes: item.notes || '',
    statut: item.statut || 'en_attente',
    source: item.source || 'salon',
    nombrePersonnes: Number(item.nombrePersonnes) || 1,
    montantTotal: item.montantTotal ? Number(item.montantTotal) : undefined,
    financeValide: hasFinance || isTermine,
    venteId: typeof item.vente === 'object' ? item.vente?._id || item.vente?.id : item.vente || item.venteId,
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
    onSuccess: (newRdv) => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', salonId] });
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          sendNativeNotification('📅 Nouveau Rendez-vous enregistré !', {
            body: `Rendez-vous programmé à ${newRdv.heure || 'l\'heure indiquée'}.`,
            tag: `rdv-created-${newRdv.id || Date.now()}`,
            url: '/rendez-vous',
            data: { url: '/rendez-vous' },
          });
        }
      } catch (e) {
        console.error('Instant notification error:', e);
      }
    },
  });

  // Mutation: Mettre à jour un rendez-vous
  const updateRendezVousMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RendezVous> }) => {
      if (!salonId) throw new Error('Salon non identifié');
      const payload: any = { ...updates };
      if (updates.clientId) payload.client = updates.clientId;
      if (updates.typePrestationId) payload.typePrestation = updates.typePrestationId;
      if (updates.venteId) {
        payload.vente = updates.venteId;
        payload.venteId = updates.venteId;
      }

      const res = await api.updateRendezVous(salonId, id, payload);
      return normalizeRendezVous(res);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['rendezVous', salonId] });
      const previous = queryClient.getQueryData<RendezVous[]>(['rendezVous', salonId]);
      queryClient.setQueryData<RendezVous[]>(['rendezVous', salonId], (old = []) =>
        old.map((r) => {
          if (r.id === id) {
            const isFinished = updates.statut === 'termine' || updates.statut === 'completed';
            const isFinanced = updates.financeValide ?? (isFinished ? true : r.financeValide);
            return {
              ...r,
              ...updates,
              financeValide: isFinanced,
            };
          }
          return r;
        })
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['rendezVous', salonId], context.previous);
      }
    },
    onSettled: () => {
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

  const updateRendezVousAsync = useCallback(
    async (args: { id: string; updates: Partial<RendezVous> }) => {
      return await updateRendezVousMutation.mutateAsync(args);
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
    updateRendezVousAsync,
    deleteRendezVous,
    getRendezVousByDate,
    getRendezVousAujourdhui,
    getDatesAvecRendezVous,
  };
}
