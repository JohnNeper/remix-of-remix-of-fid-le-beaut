// Types pour LeaderBright BeautyFlow

export type ClientStatus = 'nouvelle' | 'reguliere' | 'vip';

export interface Client {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  dateInscription: string;
  dateAnniversaire?: string;
  statut: ClientStatus;
  notes?: string;
  pointsFidelite: number;
  totalDepense: number;
  nombreVisites: number;
  derniereVisite?: string;
  parrainId?: string;
  filleuls?: string[];
  groupe?: string;
}

// Produits & Stock
export interface Produit {
  id: string;
  nom: string;
  categorie: string;
  prix: number;
  prixAchat: number;
  quantite: number;
  seuilAlerte: number;
  description?: string;
  unite: string;
}

// Ventes
export interface Vente {
  id: string;
  date: string;
  clientId?: string;
  employe?: string;
  items: VenteItem[];
  totalMontant: number;
  modePaiement: 'especes' | 'mobile_money' | 'carte' | 'mixte';
  notes?: string;
}

export interface VenteItem {
  type: 'produit' | 'prestation';
  referenceId: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

// Dépenses
export interface Depense {
  id: string;
  date: string;
  categorie: string;
  description: string;
  montant: number;
}

export interface TypePrestation {
  id: string;
  nom: string;
  prix: number;
  description?: string;
  categorie?: string;
  imageUrl?: string;
}

export interface Prestation {
  id: string;
  clientId: string;
  typePrestationId: string;
  date: string;
  employe?: string;
  notes?: string;
  imageUrls?: string[];
  montant: number;
}

export interface Rappel {
  id: string;
  clientId: string;
  type: 'inactivite' | 'suivi' | 'anniversaire' | 'personnalise';
  dateCreation: string;
  dateEnvoi?: string;
  message: string;
  statut: 'en_attente' | 'envoye' | 'annule';
}

export interface ConfigFidelite {
  visitesRequises: number;
  reductionPourcentage: number;
  visitesVIP: number;
}

export interface Salon {
  id: string;
  _id?: string;
  name: string;
  slug?: string;
  slogan?: string;
  description?: string;
  logoUrl?: string;
  logo?: string;
  bannerUrl?: string;
  galleryUrls?: string[];
  branding?: any;
  isHidden?: boolean;
  hidden?: boolean;
  typeEtablissement?: 'salon_coiffure' | 'spa' | 'institut_beaute' | 'barbershop' | 'onglerie' | 'mixte' | 'autre';

  phone: string;
  email: string;
  address: string;
  ville?: string;
  pays?: string;
  location?: { lat: number; lng: number };

  devise?: string;
  horaires?: string;
  availability?: any;
  disponibilite?: any;

  joursRappelInactivite: number;
  joursRappelSuivi: number;
  configFidelite: ConfigFidelite;

  owner: string; // or User type depending on population
  abonnement?: {
    statut: 'actif' | 'expire' | 'suspendu' | 'essai' | string;
    montant: number;
    dureeJours?: number;
    dateDebut: string;
    dateFin: string;
    dernierPaiement?: string;
    renouvellementAuto?: boolean;
    downgradePlan?: string | null;
    downgradeDate?: string | null;
  };
  plan?: 'basic' | 'pro' | 'premium' | string;
  affiliateCode?: string | null;
  affiliatePaid?: boolean;
  isActive?: boolean;

  limits?: {
    maxCustomers: number;
    maxStaff: number;
    maxRendezvous?: number;
    maxCampaignsPerMonth: number;
    exportEnabled: boolean;
    campaignsEnabled: boolean;
  };
  paymentConfig?: {
    payoutMomoNumber?: string;
    payoutOperator?: 'mtn' | 'orange' | '';
    payoutMomoName?: string;
    payoutMtnNumber?: string;
    payoutMtnName?: string;
    payoutOrangeNumber?: string;
    payoutOrangeName?: string;
    payoutWaveNumber?: string;
    payoutWaveName?: string;
  };

  // Legacy / Aliases (gardés pour rétrocompatibilité frontend temporaire)
  nom?: string;
  telephone?: string;
  adresse?: string;
}

export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  role: 'admin' | 'employe';
  salonId: string;
  avatarUrl?: string;
}

export interface StatistiquesDashboard {
  totalClientes: number;
  clientesActives: number;
  clientesInactives: number;
  visitesCeMois: number;
  revenusCeMois: number;
  prestationsPopulaires: { nom: string; count: number }[];
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  salonId?: string;
  telephone?: string;
  avatarUrl?: string;
}
