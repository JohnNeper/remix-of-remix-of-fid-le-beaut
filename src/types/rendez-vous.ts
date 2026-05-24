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
  // Public booking fields (when source === 'public')
  source?: 'salon' | 'public';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  reference?: string; // short human reference e.g. "BF-A1B2"
  createdAt?: string; // ISO timestamp
}
