import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TypePrestation, Prestation } from '@/types';
import { defaultTypesPrestations } from '@/lib/mock-data';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function normalizeTypePrestation(item: any): TypePrestation {
  return {
    ...item,
    id: item._id || item.id,
    nom: item.nom || 'Prestation',
    prix: typeof item.prix === 'number' ? item.prix : parseFloat(item.prix || 0),
    description: item.description || '',
    categorie: item.categorie || '',
    imageUrl: item.imageUrl || '',
  };
}

function normalizePrestation(item: any): Prestation {
  return {
    ...item,
    id: item._id || item.id,
    clientId: item.clientId?._id || item.clientId || '',
    typePrestationId: item.typePrestationId?._id || item.typePrestationId || '',
    date: item.date || item.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    employe: typeof item.employe === 'object' ? item.employe?.name : item.employe,
    notes: item.notes || '',
    imageUrls: item.imageUrls || [],
    montant: typeof item.montant === 'number' ? item.montant : parseFloat(item.montant || 0),
  };
}

export function usePrestations() {
  const { session } = useAuth();
  const salonId = session?.salonId;
  const queryClient = useQueryClient();

  // Query: Types de Prestations (Catalogue)
  const { data: rawTypes = [], isLoading: loadingTypes } = useQuery<TypePrestation[]>({
    queryKey: ['typesPrestations', salonId],
    queryFn: async () => {
      if (!salonId) return defaultTypesPrestations;
      try {
        const data = await api.getTypesPrestations(salonId);
        if (!data || data.length === 0) {
          return defaultTypesPrestations;
        }
        return data.map(normalizeTypePrestation);
      } catch (err) {
        console.error('Erreur lors du chargement des types de prestations:', err);
        return defaultTypesPrestations;
      }
    },
    enabled: !!salonId,
  });

  const typesPrestations = rawTypes.length > 0 ? rawTypes : defaultTypesPrestations;

  // Query: Prestations effectuées (Historique)
  const { data: prestations = [], isLoading: loadingPrestations } = useQuery<Prestation[]>({
    queryKey: ['prestations', salonId],
    queryFn: async () => {
      if (!salonId) return [];
      try {
        const data = await api.getPrestations(salonId);
        return (data || []).map(normalizePrestation);
      } catch (err) {
        console.error('Erreur lors du chargement des prestations:', err);
        return [];
      }
    },
    enabled: !!salonId,
  });

  // Mutation: Ajouter un type de prestation
  const addTypePrestationMutation = useMutation({
    mutationFn: async (type: Omit<TypePrestation, 'id'>) => {
      if (!salonId) throw new Error('Salon non identifié');
      const res = await api.createTypePrestation(salonId, type);
      return normalizeTypePrestation(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesPrestations', salonId] });
    },
  });

  // Mutation: Mettre à jour un type de prestation
  const updateTypePrestationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TypePrestation> }) => {
      if (!salonId) throw new Error('Salon non identifié');
      const res = await api.updateTypePrestation(salonId, id, updates);
      return normalizeTypePrestation(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesPrestations', salonId] });
    },
  });

  // Mutation: Supprimer un type de prestation
  const deleteTypePrestationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!salonId) throw new Error('Salon non identifié');
      await api.deleteTypePrestation(salonId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typesPrestations', salonId] });
    },
  });

  // Mutation: Enregistrer une nouvelle prestation effectuée
  const addPrestationMutation = useMutation({
    mutationFn: async (prestation: Omit<Prestation, 'id' | 'date'>) => {
      if (!salonId) throw new Error('Salon non identifié');
      const dateStr = new Date().toISOString().split('T')[0];
      const payload = {
        ...prestation,
        date: dateStr,
      };
      const res = await api.createPrestation(salonId, payload as any);
      return normalizePrestation(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestations', salonId] });
    },
  });

  const addTypePrestation = useCallback(
    async (type: Omit<TypePrestation, 'id'>) => {
      return await addTypePrestationMutation.mutateAsync(type);
    },
    [addTypePrestationMutation]
  );

  const updateTypePrestation = useCallback(
    (id: string, updates: Partial<TypePrestation>) => {
      updateTypePrestationMutation.mutate({ id, updates });
    },
    [updateTypePrestationMutation]
  );

  const deleteTypePrestation = useCallback(
    (id: string) => {
      deleteTypePrestationMutation.mutate(id);
    },
    [deleteTypePrestationMutation]
  );

  const getTypePrestation = useCallback(
    (id: string) => {
      return typesPrestations.find((t) => t.id === id || (t as any)._id === id);
    },
    [typesPrestations]
  );

  const addPrestation = useCallback(
    async (prestation: Omit<Prestation, 'id' | 'date'>) => {
      return await addPrestationMutation.mutateAsync(prestation);
    },
    [addPrestationMutation]
  );

  const getPrestationsClient = useCallback(
    (clientId: string) => {
      return prestations
        .filter((p) => p.clientId === clientId || (p as any).clientId?._id === clientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [prestations]
  );

  const getPrestationsCeMois = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return prestations.filter((p) => new Date(p.date) >= startOfMonth);
  }, [prestations]);

  const getRevenusCeMois = useCallback(() => {
    return getPrestationsCeMois().reduce((sum, p) => sum + p.montant, 0);
  }, [getPrestationsCeMois]);

  const getPrestationsPopulaires = useCallback(() => {
    const counts: Record<string, number> = {};
    prestations.forEach((p) => {
      const type = typesPrestations.find((t) => t.id === p.typePrestationId || (t as any)._id === p.typePrestationId);
      if (type) counts[type.nom] = (counts[type.nom] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([nom, count]) => ({ nom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [prestations, typesPrestations]);

  return {
    typesPrestations,
    prestations,
    loading: loadingTypes || loadingPrestations,
    addTypePrestation,
    updateTypePrestation,
    deleteTypePrestation,
    getTypePrestation,
    addPrestation,
    getPrestationsClient,
    getPrestationsCeMois,
    getRevenusCeMois,
    getPrestationsPopulaires,
  };
}
