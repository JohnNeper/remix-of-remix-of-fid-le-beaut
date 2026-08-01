import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Produit } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const defaultProduits: Produit[] = [
  { id: '1', nom: 'Shampoing professionnel', categorie: 'Cheveux', prix: 5000, prixAchat: 3000, quantite: 24, seuilAlerte: 5, unite: 'bouteille', description: 'Shampoing kératine 500ml' },
  { id: '2', nom: 'Après-shampoing', categorie: 'Cheveux', prix: 4500, prixAchat: 2500, quantite: 18, seuilAlerte: 5, unite: 'bouteille' },
  { id: '3', nom: 'Huile de coco', categorie: 'Cheveux', prix: 3000, prixAchat: 1500, quantite: 30, seuilAlerte: 8, unite: 'flacon' },
  { id: '4', nom: 'Crème défrisante', categorie: 'Cheveux', prix: 6000, prixAchat: 3500, quantite: 12, seuilAlerte: 4, unite: 'pot' },
  { id: '5', nom: 'Vernis à ongles', categorie: 'Ongles', prix: 2000, prixAchat: 800, quantite: 45, seuilAlerte: 10, unite: 'flacon' },
  { id: '6', nom: 'Gel UV', categorie: 'Ongles', prix: 8000, prixAchat: 4500, quantite: 8, seuilAlerte: 3, unite: 'pot' },
  { id: '7', nom: 'Fond de teint', categorie: 'Maquillage', prix: 12000, prixAchat: 7000, quantite: 15, seuilAlerte: 3, unite: 'tube' },
  { id: '8', nom: 'Rouge à lèvres', categorie: 'Maquillage', prix: 5000, prixAchat: 2500, quantite: 20, seuilAlerte: 5, unite: 'pièce' },
  { id: '9', nom: 'Huile de massage', categorie: 'Corps', prix: 4000, prixAchat: 2000, quantite: 10, seuilAlerte: 3, unite: 'flacon' },
  { id: '10', nom: 'Gommage corps', categorie: 'Corps', prix: 6000, prixAchat: 3000, quantite: 14, seuilAlerte: 4, unite: 'pot' },
  { id: '11', nom: 'Savon noir Hamam', categorie: 'Corps', prix: 3500, prixAchat: 1800, quantite: 20, seuilAlerte: 5, unite: 'pot' },
  { id: '12', nom: 'Lame de rasoir', categorie: 'Homme', prix: 500, prixAchat: 200, quantite: 100, seuilAlerte: 20, unite: 'pièce' },
];

export function useStock() {
  const { session } = useAuth();
  const salonId = session?.salonId;
  const queryClient = useQueryClient();

  const { data: produits = [] } = useQuery<Produit[]>({
    queryKey: ['produits', salonId],
    queryFn: async () => {
      const data = await api.getProduits(salonId!);
      // Normalise l'id et assure la rétro-compatibilité avec d'anciens documents
      return data.map((p: any) => ({
        ...p,
        id: p._id || p.id,
        prix: p.prixVente || p.prix || 0,
        quantite: p.stock !== undefined ? p.stock : p.quantite,
        seuilAlerte: p.stockMinimum !== undefined ? p.stockMinimum : p.seuilAlerte,
      }));
    },
    enabled: !!salonId,
  });

  const addMutation = useMutation({
    mutationFn: (produit: Omit<Produit, 'id'>) => {
      // Mapper les noms frontend → backend
      const payload: any = {
        ...produit,
        prixVente: (produit as any).prix,
        stock: (produit as any).quantite,
        stockMinimum: (produit as any).seuilAlerte
      };
      // Supprimer les clés frontend pour éviter la confusion
      delete payload.prix;
      delete payload.quantite;
      delete payload.seuilAlerte;

      return api.createProduit(salonId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits', salonId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Produit> }) => {
      const payload: any = { ...updates };
      if ('prix' in payload) {
        payload.prixVente = payload.prix;
        delete payload.prix;
      }
      if ('quantite' in payload) {
        payload.stock = payload.quantite;
        delete payload.quantite;
      }
      if ('seuilAlerte' in payload) {
        payload.stockMinimum = payload.seuilAlerte;
        delete payload.seuilAlerte;
      }
      return api.updateProduit(salonId!, id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits', salonId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduit(salonId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits', salonId] });
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, quantiteChange }: { id: string, quantiteChange: number }) => {
      const p = produits.find(p => p.id === id);
      if (!p) throw new Error("Produit non trouvé");
      return api.adjustStock(salonId!, id, p.quantite, quantiteChange);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits', salonId] });
    },
  });

  const produitsEnAlerte = useMemo(() => produits.filter(p => p.quantite <= p.seuilAlerte), [produits]);
  const categories = useMemo(() => [...new Set(produits.map(p => p.categorie))], [produits]);
  const valeurStock = useMemo(() => produits.reduce((sum, p) => sum + p.prixAchat * p.quantite, 0), [produits]);

  return {
    produits,
    addProduit: addMutation.mutate,
    updateProduit: (id: string, updates: Partial<Produit>) =>
      updateMutation.mutate({ id, updates }),
    deleteProduit: deleteMutation.mutate,
    adjustStock: (id: string, quantiteChange: number) =>
      adjustStockMutation.mutateAsync({ id, quantiteChange }),
    produitsEnAlerte,
    categories,
    valeurStock,
  };
}
