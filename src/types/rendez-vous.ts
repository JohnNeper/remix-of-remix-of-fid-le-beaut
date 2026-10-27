export interface RendezVous {
  id: string;
  clientId: string;
  typePrestationId: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:mm
  duree: number; // in minutes
  employe?: string;
  notes?: string;
  statut: 'confirme' | 'en_attente' | 'annule' | 'termine';
  source?: 'salon' | 'en_ligne' | 'public';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  reference?: string;
  createdAt?: string;
  nombrePersonnes?: number; // Nombre de bénéficiaires / personnes
  montantTotal?: number; // total montant facturé ou estimé
  financeValide?: boolean; // true si validé et facturé par les finances
  venteId?: string; // id de la vente / facture liée
  employeNom?: string; // nom de l'employé en charge
}
