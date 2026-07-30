import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, ClientStatus } from '@/types';
import { getStorageItem, setStorageItem, tenantStorageKey, STORAGE_KEYS } from '@/lib/storage';
import { mockClients } from '@/lib/mock-data';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useClients() {
  const { session } = useAuth();
  const salonId = session?.salonId;
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: loading } = useQuery<Client[]>({
    queryKey: ['clients', salonId],
    queryFn: async () => {
      try {
        const data = await api.getClients(salonId!);
        // Map 'name' from backend to 'nom' for frontend compatibility
        return data.map((client: any) => ({
          ...client,
          id: client._id || client.id,
          nom: client.nom || client.name || 'Client sans nom',
          statut: client.statut || client.status || 'nouvelle',
          dateInscription: client.dateInscription || client.createdAt || new Date().toISOString(),
        }));
      } catch (err: any) {
        if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
          return [];
        }
        throw err;
      }
    },
    enabled: !!salonId,
  });

  const addClientMutation = useMutation({
    mutationFn: (newClient: Omit<Client, 'id' | 'dateInscription' | 'pointsFidelite' | 'totalDepense' | 'nombreVisites'>) =>
      api.createClient(salonId!, newClient as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', salonId] });
    },
  });

  const addClientsMutation = useMutation({
    mutationFn: (newClients: Omit<Client, 'id' | 'dateInscription' | 'pointsFidelite' | 'totalDepense' | 'nombreVisites'>[]) =>
      api.createClients(salonId!, newClients as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', salonId] });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) => api.updateClient(salonId!, id, updates as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', salonId] });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => api.deleteClient(salonId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', salonId] });
    },
  });

  const checkDuplicatesMutation = useMutation({
    mutationFn: (phones: string[]) => api.checkDuplicates(salonId!, phones),
  });

  const bulkImportMutation = useMutation({
    mutationFn: (payload: {
      contacts: Array<{ nom: string; telephone: string }>;
      groupe?: { nom: string; couleur: string; description: string };
    }) => api.bulkImport(salonId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', salonId] });
      queryClient.invalidateQueries({ queryKey: ['contactGroups', salonId] });
    },
  });

  const addClient = async (client: Omit<Client, 'id' | 'dateInscription' | 'pointsFidelite' | 'totalDepense' | 'nombreVisites'>) => {
    return await addClientMutation.mutateAsync(client);
  };

  const addClients = (clients: Omit<Client, 'id' | 'dateInscription' | 'pointsFidelite' | 'totalDepense' | 'nombreVisites'>[]) => {
    return addClientsMutation.mutateAsync(clients);
  };

  const checkDuplicates = (phones: string[]) => {
    return checkDuplicatesMutation.mutateAsync(phones);
  };

  const bulkImport = (payload: {
    contacts: Array<{ nom: string; telephone: string }>;
    groupe?: { nom: string; couleur: string; description: string };
  }) => {
    return bulkImportMutation.mutateAsync(payload);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    updateClientMutation.mutate({ id, updates });
  };

  const deleteClient = (id: string) => {
    deleteClientMutation.mutate(id);
  };

  const getClient = (id: string) => {
    return clients.find(c => (c as any)._id === id || c.id === id);
  };

  const searchClients = useCallback((query: string) => {
    const q = query.toLowerCase();
    return clients.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.telephone.includes(q)
    );
  }, [clients]);

  const getClientsByStatus = useCallback((status: ClientStatus) => {
    return clients.filter(c => c.statut === status);
  }, [clients]);

  const getInactiveClients = useCallback((days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return clients.filter(c => {
      if (!c.derniereVisite) return true;
      return new Date(c.derniereVisite) < cutoffDate;
    });
  }, [clients]);

  const updateClientStats = (clientId: string, montant: number) => {
    // This logic might be better handled on the backend when a prestation is added
    console.warn('updateClientStats should be handled on the backend');
  };

  const searchClientsRemote = async (query: string) => {
    if (!salonId) return [];
    const data = await api.searchClients(salonId, query);
    return data.map((client: any) => ({
      ...client,
      id: client._id || client.id,
      nom: client.nom || client.name || 'Client sans nom',
      statut: client.statut || client.status || 'nouvelle',
      dateInscription: client.dateInscription || client.createdAt || new Date().toISOString(),
    }));
  };

  return {
    clients,
    loading,
    addClient,
    addClients,
    checkDuplicates,
    bulkImport,
    updateClient,
    deleteClient,
    getClient,
    searchClients, // Local search (for owner)
    searchClientsRemote, // Remote search (for staff)
    getClientsByStatus,
    getInactiveClients,
    updateClientStats
  };
}
