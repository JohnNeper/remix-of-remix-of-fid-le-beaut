// Types pour le système multi-tenant
import type { PlanType } from '@/lib/plans';

export type SalonUserRole = 'owner' | 'staff';

export interface SalonUser {
  id: string;
  salonId: string;
  nom: string;
  email: string;
  motDePasse: string; // hash simple
  role: SalonUserRole;
  telephone?: string;
  dateCreation: string;
}

export interface SalonAccount {
  id: string;
  nom: string;
  proprietaire: string;
  telephone: string;
  adresse?: string;
  email: string;
  motDePasse: string; // hash simple (legacy, owner default)
  dateCreation: string;
  dernierPaiement: string; // date ISO
  abonnementActif: boolean;
  montantAbonnement: number; // FCFA — set from plan price
  joursAbonnement: number; // 30
  plan: PlanType; // subscription tier
  users?: SalonUser[]; // owner + staff
}

export interface AdminUser {
  email: string;
  motDePasse: string;
}

export interface AuthSession {
  type: 'admin' | 'salon';
  salonId?: string;
  userId?: string;
  userRole?: SalonUserRole;
  userName?: string;
  email: string;
  timestamp: number;
}
