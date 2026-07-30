import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Vente, Depense } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function normalizeVente(item: any): Vente {
  return {
    ...item,
    id: item._id || item.id,
    date: item.date || new Date().toISOString().split('T')[0],
    totalMontant: item.totalMontant !== undefined ? item.totalMontant : item.montant || 0,
    items: Array.isArray(item.items) ? item.items : [],
    modePaiement: item.modePaiement || 'especes',
  };
}

function normalizeDepense(item: any): Depense {
  return {
    ...item,
    id: item._id || item.id,
    date: item.date || new Date().toISOString().split('T')[0],
    categorie: item.categorie || 'Autre',
    description: item.description || '',
    montant: item.montant || 0,
  };
}

export function useFinances() {
  const { session } = useAuth();
  const salonId = session?.salonId;
  const queryClient = useQueryClient();

  // Query Ventes
  const { data: ventes = [], isLoading: loadingVentes } = useQuery<Vente[]>({
    queryKey: ['ventes', salonId],
    queryFn: async () => {
      if (!salonId) return [];
      try {
        const data = await api.getVentes(salonId);
        return (data || []).map(normalizeVente);
      } catch (err) {
        console.error('Erreur chargement ventes:', err);
        return [];
      }
    },
    enabled: !!salonId,
  });

  // Query Dépenses
  const { data: depenses = [], isLoading: loadingDepenses } = useQuery<Depense[]>({
    queryKey: ['depenses', salonId],
    queryFn: async () => {
      if (!salonId) return [];
      try {
        const data = await api.getDepenses(salonId);
        return (data || []).map(normalizeDepense);
      } catch (err) {
        console.error('Erreur chargement dépenses:', err);
        return [];
      }
    },
    enabled: !!salonId,
  });

  // Mutation Add Vente
  const addVenteMutation = useMutation({
    mutationFn: async (vente: Omit<Vente, 'id'>) => {
      if (!salonId) throw new Error('Salon non identifié');
      const res = await api.createVente(salonId, vente);
      return normalizeVente(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventes', salonId] });
    },
  });

  // Mutation Delete Vente
  const deleteVenteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!salonId) throw new Error('Salon non identifié');
      return api.deleteVente(salonId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventes', salonId] });
    },
  });

  // Mutation Add Dépense
  const addDepenseMutation = useMutation({
    mutationFn: async (depense: Omit<Depense, 'id'>) => {
      if (!salonId) throw new Error('Salon non identifié');
      const res = await api.createDepense(salonId, depense);
      return normalizeDepense(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses', salonId] });
    },
  });

  // Mutation Delete Dépense
  const deleteDepenseMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!salonId) throw new Error('Salon non identifié');
      return api.deleteDepense(salonId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses', salonId] });
    },
  });

  // Computed Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ventesMois = ventes.filter(v => v.date.startsWith(thisMonth));
    const depensesMois = depenses.filter(d => d.date.startsWith(thisMonth));
    const totalRevenus = ventesMois.reduce((s, v) => s + (v.totalMontant || 0), 0);
    const totalDepenses = depensesMois.reduce((s, d) => s + (d.montant || 0), 0);
    const benefice = totalRevenus - totalDepenses;
    const revenusProduits = ventesMois.reduce((s, v) => s + (v.items || []).filter(i => i.type === 'produit').reduce((si, i) => si + (i.montant || 0), 0), 0);
    const revenusPrestations = ventesMois.reduce((s, v) => s + (v.items || []).filter(i => i.type === 'prestation').reduce((si, i) => si + (i.montant || 0), 0), 0);
    
    const parModePaiement: Record<string, number> = {};
    ventesMois.forEach(v => { 
      const mode = v.modePaiement || 'autre';
      parModePaiement[mode] = (parModePaiement[mode] || 0) + (v.totalMontant || 0); 
    });

    const parCategorieDepense: Record<string, number> = {};
    depensesMois.forEach(d => { 
      const cat = d.categorie || 'Autre';
      parCategorieDepense[cat] = (parCategorieDepense[cat] || 0) + (d.montant || 0); 
    });

    return { 
      totalRevenus, 
      totalDepenses, 
      benefice, 
      revenusProduits, 
      revenusPrestations, 
      nombreVentes: ventesMois.length, 
      parModePaiement, 
      parCategorieDepense 
    };
  }, [ventes, depenses]);

  return {
    ventes,
    depenses,
    loadingVentes,
    loadingDepenses,
    loading: loadingVentes || loadingDepenses,
    addVente: addVenteMutation.mutate,
    addVenteAsync: addVenteMutation.mutateAsync,
    deleteVente: deleteVenteMutation.mutate,
    deleteVenteAsync: deleteVenteMutation.mutateAsync,
    addDepense: addDepenseMutation.mutate,
    addDepenseAsync: addDepenseMutation.mutateAsync,
    deleteDepense: deleteDepenseMutation.mutate,
    deleteDepenseAsync: deleteDepenseMutation.mutateAsync,
    stats,
  };
}
