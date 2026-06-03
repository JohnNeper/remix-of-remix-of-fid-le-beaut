import { SalonAccount, AdminUser, AuthSession, SalonUser, SalonUserRole } from '@/types/auth';
import { getPlan } from '@/lib/plans';
import type { PlanType } from '@/lib/plans';
import { getStorageItem, setStorageItem } from '@/lib/storage';

const ADMIN_KEY = 'beautyflow_admin';
const SALONS_KEY = 'beautyflow_salons_accounts';
const SESSION_KEY = 'beautyflow_session';

// Simple hash (pas cryptographique, suffisant pour localStorage MVP)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

// Admin par défaut
const defaultAdmin: AdminUser = {
  email: 'admin@leaderbright.com',
  motDePasse: simpleHash('admin2025'),
};

// ===== Admin =====
export function getAdmin(): AdminUser {
  return getStorageItem(ADMIN_KEY, defaultAdmin);
}

export function verifyAdmin(email: string, password: string): boolean {
  const admin = getAdmin();
  return admin.email === email && admin.motDePasse === simpleHash(password);
}

// ===== Salons =====
export function getSalonAccounts(): SalonAccount[] {
  const salons = getStorageItem<SalonAccount[]>(SALONS_KEY, []);
  // Backfill slug + branding + bookingSettings for legacy accounts
  let mutated = false;
  const usedSlugs = new Set<string>();
  for (const s of salons) {
    if (!s.slug) {
      const root = slugify(s.nom);
      let candidate = root;
      let n = 1;
      while (usedSlugs.has(candidate)) { n += 1; candidate = `${root}-${n}`; }
      s.slug = candidate;
      mutated = true;
    }
    usedSlugs.add(s.slug);
    if (!s.branding) {
      s.branding = { description: '', location: s.adresse || '', hours: '' };
      mutated = true;
    }
    if (!s.bookingSettings) {
      s.bookingSettings = {
        autoConfirm: true, allowGuest: true, slotDurationMin: 30,
        openingHour: 9, closingHour: 19, closedDays: [0],
      };
      mutated = true;
    }
  }
  if (mutated) setStorageItem(SALONS_KEY, salons);
  return salons;
}

export function saveSalonAccounts(salons: SalonAccount[]): void {
  setStorageItem(SALONS_KEY, salons);
}

// ===== Slug helpers (public booking) =====
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'salon';
}

export function generateUniqueSlug(base: string, excludeId?: string): string {
  const salons = getSalonAccounts();
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  while (salons.some(s => s.slug === candidate && s.id !== excludeId)) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export function getSalonBySlug(slug: string): SalonAccount | null {
  if (!slug) return null;
  const target = slug.toLowerCase();
  return getSalonAccounts().find(s => (s.slug || '').toLowerCase() === target) || null;
}

export function updateSalonAccount(salonId: string, updates: Partial<SalonAccount>): SalonAccount | null {
  const salons = getSalonAccounts();
  const i = salons.findIndex(s => s.id === salonId);
  if (i < 0) return null;
  // Enforce slug uniqueness if changed
  if (updates.slug && updates.slug !== salons[i].slug) {
    updates.slug = generateUniqueSlug(updates.slug, salonId);
  }
  salons[i] = { ...salons[i], ...updates };
  saveSalonAccounts(salons);
  return salons[i];
}

export function createSalonAccount(data: Omit<SalonAccount, 'id' | 'dateCreation' | 'abonnementActif' | 'montantAbonnement' | 'joursAbonnement' | 'users'>): SalonAccount {
  const salons = getSalonAccounts();
  const salonId = crypto.randomUUID();
  const hashedPwd = simpleHash(data.motDePasse);

  // Create owner user
  const ownerUser: SalonUser = {
    id: crypto.randomUUID(),
    salonId,
    nom: data.proprietaire,
    email: data.email,
    motDePasse: hashedPwd,
    role: 'owner',
    telephone: data.telephone,
    dateCreation: new Date().toISOString().split('T')[0],
  };

  const selectedPlan = getPlan((data as any).plan || 'basic');

  const newSalon: SalonAccount = {
    ...data,
    id: salonId,
    dateCreation: new Date().toISOString().split('T')[0],
    motDePasse: hashedPwd,
    abonnementActif: true,
    montantAbonnement: selectedPlan.price,
    joursAbonnement: 30,
    plan: selectedPlan.name,
    users: [ownerUser],
    slug: generateUniqueSlug(data.nom),
    branding: {
      description: '',
      location: data.adresse || '',
      hours: '',
    },
    bookingSettings: {
      autoConfirm: true,
      allowGuest: true,
      slotDurationMin: 30,
      openingHour: 9,
      closingHour: 19,
      closedDays: [0],
    },
  };
  salons.push(newSalon);
  saveSalonAccounts(salons);
  return newSalon;
}

// ===== Staff management =====
export function addStaffToSalon(salonId: string, staffData: { nom: string; email: string; motDePasse: string; telephone?: string }): SalonUser | null {
  const salons = getSalonAccounts();
  const index = salons.findIndex(s => s.id === salonId);
  if (index < 0) return null;

  // Check email uniqueness across all salon users
  const allEmails = salons.flatMap(s => (s.users || []).map(u => u.email));
  if (allEmails.includes(staffData.email)) return null;

  const newUser: SalonUser = {
    id: crypto.randomUUID(),
    salonId,
    nom: staffData.nom,
    email: staffData.email,
    motDePasse: simpleHash(staffData.motDePasse),
    role: 'staff',
    telephone: staffData.telephone,
    dateCreation: new Date().toISOString().split('T')[0],
  };

  if (!salons[index].users) salons[index].users = [];
  salons[index].users!.push(newUser);
  saveSalonAccounts(salons);
  return newUser;
}

export function removeStaffFromSalon(salonId: string, userId: string): boolean {
  const salons = getSalonAccounts();
  const index = salons.findIndex(s => s.id === salonId);
  if (index < 0) return false;
  salons[index].users = (salons[index].users || []).filter(u => u.id !== userId || u.role === 'owner');
  saveSalonAccounts(salons);
  return true;
}

export function getSalonUsers(salonId: string): SalonUser[] {
  const salons = getSalonAccounts();
  const salon = salons.find(s => s.id === salonId);
  return salon?.users || [];
}

// ===== Login =====
export function verifySalonLogin(email: string, password: string): { salon: SalonAccount; user: SalonUser } | null {
  const salons = getSalonAccounts();
  const hashed = simpleHash(password);

  for (const salon of salons) {
    // Check salon users first
    if (salon.users && salon.users.length > 0) {
      const user = salon.users.find(u => u.email === email && u.motDePasse === hashed);
      if (user) return { salon, user };
    }
    // Legacy fallback: direct salon email/password (for old accounts without users array)
    if (salon.email === email && salon.motDePasse === hashed) {
      const legacyUser: SalonUser = {
        id: 'legacy_' + salon.id,
        salonId: salon.id,
        nom: salon.proprietaire,
        email: salon.email,
        motDePasse: salon.motDePasse,
        role: 'owner',
        dateCreation: salon.dateCreation,
      };
      return { salon, user: legacyUser };
    }
  }
  return null;
}

export function isSalonSubscriptionActive(salon: SalonAccount): boolean {
  if (!salon.abonnementActif) return false;
  const lastPayment = new Date(salon.dernierPaiement);
  const expiry = new Date(lastPayment);
  expiry.setDate(expiry.getDate() + salon.joursAbonnement);
  return new Date() <= expiry;
}

export function renewSalonSubscription(salonId: string): void {
  const salons = getSalonAccounts();
  const index = salons.findIndex(s => s.id === salonId);
  if (index >= 0) {
    salons[index].dernierPaiement = new Date().toISOString().split('T')[0];
    salons[index].abonnementActif = true;
    saveSalonAccounts(salons);
  }
}

export function toggleSalonActive(salonId: string, active: boolean): void {
  const salons = getSalonAccounts();
  const index = salons.findIndex(s => s.id === salonId);
  if (index >= 0) {
    salons[index].abonnementActif = active;
    saveSalonAccounts(salons);
  }
}

// ===== Session =====
export function getSession(): AuthSession | null {
  return getStorageItem(SESSION_KEY, null);
}

export function setSession(session: AuthSession): void {
  setStorageItem(SESSION_KEY, session);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ===== Tenant storage keys =====
export function tenantKey(salonId: string, key: string): string {
  return `bf_${salonId}_${key}`;
}
