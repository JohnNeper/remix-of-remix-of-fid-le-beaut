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
  joursRappelInactivite?: number;
  joursRappelSuivi?: number;
  configFidelite?: any;
  // ===== Public booking (multi-tenant white-label) =====
  slug?: string; // unique URL identifier e.g. "neyohair"
  branding?: SalonBranding;
  bookingSettings?: SalonBookingSettings;
}

export interface SalonBranding {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;  // HSL string e.g. "350 80% 55%"
  secondaryColor?: string; // HSL string
  description?: string;
  location?: string;
  hours?: string;
  instagram?: string;
  gallery?: string[];
  rating?: number;        // 0-5
  reviewCount?: number;
  category?: string;      // e.g. "Coiffure", "Onglerie", "Spa"
  staff?: SalonStaff[];
}

export interface SalonStaff {
  id: string;
  nom: string;
  role?: string;      // e.g. "Coiffeuse senior"
  photoUrl?: string;
  bio?: string;
  specialties?: string[];
}

// ===== Client (public booking portal) accounts =====
export interface ClientVisit {
  salonId: string;
  salonSlug: string;
  salonNom: string;
  visitedAt: string; // ISO
}

export interface ClientAccount {
  id: string;
  nom: string;
  email: string;
  motDePasse: string; // simple hash
  telephone?: string;
  dateCreation: string;
  favorites: string[]; // salon ids
  visits: ClientVisit[];
  avatarUrl?: string;
}

export interface SalonBookingSettings {
  autoConfirm: boolean;
  allowGuest: boolean;
  slotDurationMin: number; // default 30
  openingHour: number; // 0-23, default 9
  closingHour: number; // 0-23, default 19
  closedDays?: number[]; // 0=Sunday, 6=Saturday
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
  token?: string; // added to support the token
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: any;
  salon?: any;
}

export interface AbonnementData {
  statut: string;
  montant: number;
  dureeJours?: number;
  dateDebut: string;
  dateFin: string;
  dernierPaiement?: string;
  renouvellementAuto?: boolean;
}

export function buildSession(user: any, salon: any | null, token: string): AuthSession {
  const isAdminRole = user?.role === 'admin' || user?.role === 'superadmin';
  const salonId = salon?.id || salon?._id || user?.salon || user?.salonId;

  if (isAdminRole) {
    return {
      type: 'admin',
      userId: user?.id || user?._id,
      userName: user?.nom || user?.name || user?.email,
      email: user?.email,
      timestamp: Date.now(),
      token,
    };
  }

  return {
    type: 'salon',
    salonId: salonId || (user?.id || user?._id) || 'salon-1',
    userId: user?.id || user?._id,
    userRole: user?.role || 'owner',
    userName: user?.nom || user?.name || user?.email,
    email: user?.email,
    timestamp: Date.now(),
    token,
  };
}
