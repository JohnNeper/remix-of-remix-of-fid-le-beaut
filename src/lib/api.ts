/**
 * API Service Layer
 *
 * Migrated from localStorage to a Node.js/Express REST backend.
 * Mirrors the architecture of the hub-operating-system API service.
 */

import { type SalonAccount, type SalonUser, type AuthSession, type LoginPayload, type LoginResponse, buildSession, AbonnementData } from '@/types/auth';
import type { Salon, Client, TypePrestation, Prestation, Produit, Vente, Depense, User } from '@/types';
import { RendezVous } from '@/types/rendez-vous';
import { getStorageItem, setStorageItem, tenantStorageKey, STORAGE_KEYS } from '@/lib/storage';
import {
  verifyAdmin as verifyAdminLocal,
  verifySalonLogin as verifySalonLocal,
  getSession as getSessionLocal,
  setSession as setSessionLocal,
  clearSession as clearSessionLocal,
  getSalonAccounts,
  createSalonAccount as createSalonLocal,
  renewSalonSubscription as renewLocal,
  toggleSalonActive as toggleLocal,
  isSalonSubscriptionActive as checkSubscription
} from '@/lib/auth';

// ── Types Campagnes ───────────────────────────────────────────────────────────
export interface ContactGroup {
  _id: string;
  salon: string;
  nom: string;
  description?: string;
  couleur: string;
  clients: Array<{ _id: string; nom: string; telephone: string; statut: string } | string>;
  type: 'manuel' | 'automatique';
  filtres?: { statut?: string; inactifDepuis?: number | null };
  createdAt?: string;
  updatedAt?: string;
}

export interface Campaign {
  _id: string;
  salon: string;
  nom: string;
  message: string;
  groupes: string[] | ContactGroup[];
  groupesPredefinies: string[];
  statut: 'brouillon' | 'en_cours' | 'terminee' | 'annulee';
  stats: { total: number; envoyes: number; echecs: number; dateDebut?: string; dateFin?: string };
  delaiEntreMessages: number;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = 'http://localhost:3000/api'; //import.meta.env.VITE_BACKEND_URL || 'https://apisalon.westtechs.org/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  user?: User;
  salon?: Salon;
}

class ApiService {
  // ==================== TOKEN ====================

  private getToken(): string | null {
    return localStorage.getItem('bf_token');
  }
  private setToken(token: string): void {
    localStorage.setItem('bf_token', token);
  }
  private removeToken(): void {
    localStorage.removeItem('bf_token');
  }

  // ==================== SESSION ====================

  private getStoredSession(): AuthSession | null {
    const raw = localStorage.getItem('bf_auth_session');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }
  private storeSession(session: AuthSession): void {
    localStorage.setItem('bf_auth_session', JSON.stringify(session));
  }
  private clearStoredSession(): void {
    localStorage.removeItem('bf_auth_session');
    localStorage.removeItem('bf_token');
  }

  // ==================== CORE REQUEST ====================

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.includes('/auth/')) {
      console.warn("Token expiré → redirection login");
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      throw new Error("Session expirée");
    }

    let data: any = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Erreur API (${response.status}) : Route non trouvée ou erreur serveur. Veuillez vous assurer que le serveur a bien été mis à jour.`);
      }
      data = { success: true, data: text };
    }

    if (!response.ok) {
      throw new Error(data?.message || `Erreur API : ${response.statusText}`);
    }

    if (endpoint.includes("/auth/")) {
      return data as T;
    }

    return (data && data.data !== undefined ? data.data : data) as T;
  }

  // ==================== AUTH ====================

  async login(payload: LoginPayload): Promise<AuthSession> {
    const body = {
      email: payload.email,
      password: payload.password
    };
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    this.setToken(response.token);

    const session = buildSession(
      response.user,
      response.salon ?? null,
      response.token,
    );

    this.storeSession(session);
    return session;
  }

  async loginAdmin(payload: LoginPayload): Promise<AuthSession> {
    const body = {
      email: payload.email,
      password: payload.password
    };
    const response = await this.request<any>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    this.setToken(response.token);

    const session = buildSession(
      response.user,
      null, // les admins n'ont pas de salon
      response.token,
    );

    this.storeSession(session);
    return session;
  }

  getSession(): AuthSession | null {
    return this.getStoredSession();
  }

  clearSession(): void {
    this.clearStoredSession();
  }

  async logout(): Promise<void> {
    this.clearSession();
  }

  // ==================== SALONS ====================

  async getMySalon(salonId: string): Promise<Salon> {
    return this.request<Salon>(`/salons/${salonId}`);
  }

  async getStaff(salonId: string): Promise<User[]> {
    return this.request<User[]>(`/salons/${salonId}/staff`);
  }

  async createStaff(salonId: string, payload: { name: string; email: string; password?: string; telephone?: string }): Promise<User> {
    return this.request<User>(`/salons/${salonId}/staff`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateStaff(salonId: string, userId: string, payload: { name?: string; email?: string; password?: string; telephone?: string }): Promise<User> {
    return this.request<User>(`/salons/${salonId}/staff/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteStaff(salonId: string, userId: string): Promise<void> {
    return this.request<void>(`/salons/${salonId}/staff/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateMySalon(salonId: string, updates: Partial<Salon>): Promise<Salon> {
    return this.request<Salon>(`/salons/${salonId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateConfigFidelite(salonId: string, config: any): Promise<Salon> {
    return this.request<Salon>(`/salons/${salonId}/fidelite`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async requestUpgrade(salonId: string, plan: string, phone?: string): Promise<any> {
    if (phone) {
      return this.subscribe(salonId, { plan, phone });
    }
    return this.request<any>(`/salons/${salonId}/upgrade-request`, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async requestUpgradeByEmail(email: string, plan: string, phone?: string): Promise<any> {
    return this.subscribeByEmail({ email, plan, phone: phone || '' });
  }

  async getActiveConfig(country = 'CMR', operationType = 'DEPOSIT'): Promise<any> {
    return this.request<any>(`/payments/active-conf?country=${country}&operationType=${operationType}`);
  }

  async predictProvider(phoneNumber: string): Promise<any> {
    return this.request<any>(`/payments/predict-provider`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async getPlans(): Promise<any> {
    return this.request<any>(`/payments/plans`);
  }

  async subscribe(salonId: string, payload: { email?: string; phone: string; plan: string; operator?: string }): Promise<any> {
    return this.request<any>(`/payments/subscribe/${salonId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async subscribeByEmail(payload: { email: string; phone: string; plan: string; operator?: string }): Promise<any> {
    return this.request<any>(`/payments/subscribe-by-email`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPaymentStatus(depositId: string): Promise<any> {
    return this.request<any>(`/payments/status/${depositId}`);
  }

  async getAbonnement(salonId: string): Promise<AbonnementData> {
    return this.request<AbonnementData>(`/salons/${salonId}/abonnement`);
  }

  // ==================== CLIENTS ====================

  async getClients(salonId: string): Promise<Client[]> {
    return this.request<Client[]>(`/salons/${salonId}/clients`);
  }

  async createClient(salonId: string, client: Omit<Client, '_id' | 'createdAt' | 'updatedAt' | 'salon'>): Promise<Client> {
    return this.request<Client>(`/salons/${salonId}/clients`, {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async createClients(salonId: string, clients: Omit<Client, '_id' | 'createdAt' | 'updatedAt' | 'salon'>[]): Promise<Client[]> {
    return this.request<Client[]>(`/salons/${salonId}/clients/bulk`, {
      method: 'POST',
      body: JSON.stringify({ clients }),
    });
  }

  async checkDuplicates(salonId: string, phones: string[]): Promise<Array<{ normalise: string; exists: boolean }>> {
    return this.request<Array<{ normalise: string; exists: boolean }>>(`/salons/${salonId}/clients/check-duplicates`, {
      method: 'POST',
      body: JSON.stringify({ phones }),
    });
  }

  async bulkImport(salonId: string, payload: {
    contacts: Array<{ nom: string; telephone: string }>;
    groupe?: { nom: string; couleur: string; description: string };
  }): Promise<{ imported: number; success: boolean }> {
    return this.request<{ imported: number; success: boolean }>(`/salons/${salonId}/clients/bulk-import`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateClient(salonId: string, clientId: string, updates: Partial<Client>): Promise<Client> {
    return this.request<Client>(`/salons/${salonId}/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteClient(salonId: string, clientId: string): Promise<void> {
    return this.request(`/salons/${salonId}/clients/${clientId}`, { method: 'DELETE' });
  }

  async searchClients(salonId: string, query: string): Promise<Client[]> {
    return this.request<Client[]>(`/salons/${salonId}/clients/search?q=${encodeURIComponent(query)}`);
  }

  // ==================== PRESTATIONS ====================

  async getPrestations(salonId: string): Promise<Prestation[]> {
    return this.request<Prestation[]>(`/salons/${salonId}/prestations`);
  }

  async createPrestation(salonId: string, prestation: Omit<Prestation, 'id' | 'date'>): Promise<Prestation> {
    return this.request<Prestation>(`/salons/${salonId}/prestations`, {
      method: 'POST',
      body: JSON.stringify(prestation),
    });
  }

  async updatePrestation(salonId: string, prestationId: string, updates: Partial<Prestation>): Promise<Prestation> {
    return this.request<Prestation>(`/salons/${salonId}/prestations/${prestationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePrestation(salonId: string, prestationId: string): Promise<void> {
    return this.request(`/salons/${salonId}/prestations/${prestationId}`, { method: 'DELETE' });
  }

  // ==================== TYPES DE PRESTATIONS ====================

  async getTypesPrestations(salonId: string): Promise<TypePrestation[]> {
    return this.request<TypePrestation[]>(`/salons/${salonId}/types-prestations`);
  }

  async createTypePrestation(salonId: string, type: Omit<TypePrestation, 'id'>): Promise<TypePrestation> {
    return this.request<TypePrestation>(`/salons/${salonId}/types-prestations`, {
      method: 'POST',
      body: JSON.stringify(type),
    });
  }

  async updateTypePrestation(salonId: string, typeId: string, updates: Partial<TypePrestation>): Promise<TypePrestation> {
    return this.request<TypePrestation>(`/salons/${salonId}/types-prestations/${typeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTypePrestation(salonId: string, typeId: string): Promise<void> {
    return this.request(`/salons/${salonId}/types-prestations/${typeId}`, { method: 'DELETE' });
  }

  // ==================== PRODUITS ====================

  async getProduits(salonId: string): Promise<Produit[]> {
    return this.request<Produit[]>(`/salons/${salonId}/produits`);
  }

  async createProduit(salonId: string, produit: Omit<Produit, "_id" | "salon" | "createdAt" | "updatedAt">): Promise<Produit> {
    return this.request<Produit>(`/salons/${salonId}/produits`, {
      method: 'POST',
      body: JSON.stringify(produit),
    });
  }

  async updateProduit(salonId: string, produitId: string, updates: Partial<Produit>): Promise<Produit> {
    return this.request<Produit>(`/salons/${salonId}/produits/${produitId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduit(salonId: string, produitId: string): Promise<void> {
    return this.request(`/salons/${salonId}/produits/${produitId}`, { method: 'DELETE' });
  }

  async adjustStock(salonId: string, id: string, quantiteActuelle: number, quantiteChange: number): Promise<Produit> {
    return this.request<Produit>(`/salons/${salonId}/produits/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ stock: quantiteActuelle + quantiteChange }),
    });
  }

  // ==================== VENTES ====================

  async getVentes(salonId: string): Promise<Vente[]> {
    return this.request<Vente[]>(`/salons/${salonId}/ventes`);
  }

  async createVente(salonId: string, vente: Omit<Vente, 'id'>): Promise<Vente> {
    return this.request<Vente>(`/salons/${salonId}/ventes`, {
      method: 'POST',
      body: JSON.stringify(vente),
    });
  }

  async updateVente(salonId: string, venteId: string, updates: Partial<Vente>): Promise<Vente> {
    return this.request<Vente>(`/salons/${salonId}/ventes/${venteId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteVente(salonId: string, venteId: string): Promise<void> {
    return this.request(`/salons/${salonId}/ventes/${venteId}`, { method: 'DELETE' });
  }

  // ==================== RENDEZ-VOUS ====================

  async getRendezVous(salonId: string, params?: {
    date?: string;
    from?: string;
    to?: string;
    clientId?: string;
    statut?: string;
  }): Promise<RendezVous[]> {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.statut) query.append('statut', params.statut);
    const qs = query.toString();
    return this.request<RendezVous[]>(`/salons/${salonId}/rendez-vous${qs ? `?${qs}` : ''}`);
  }

  async createRendezVous(salonId: string, rdv: Omit<RendezVous, '_id' | 'salon' | 'createdAt' | 'updatedAt'>): Promise<RendezVous> {
    return this.request<RendezVous>(`/salons/${salonId}/rendez-vous`, {
      method: 'POST',
      body: JSON.stringify(rdv),
    });
  }

  async updateRendezVous(salonId: string, id: string, updates: Partial<RendezVous>): Promise<RendezVous> {
    return this.request<RendezVous>(`/salons/${salonId}/rendez-vous/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRendezVous(salonId: string, id: string): Promise<void> {
    return this.request(`/salons/${salonId}/rendez-vous/${id}`, { method: 'DELETE' });
  }

  // ==================== DÉPENSES ====================

  async getDepenses(salonId: string): Promise<Depense[]> {
    return this.request<Depense[]>(`/salons/${salonId}/depenses`);
  }

  async createDepense(salonId: string, depense: Omit<Depense, 'id'>): Promise<Depense> {
    return this.request<Depense>(`/salons/${salonId}/depenses`, {
      method: 'POST',
      body: JSON.stringify(depense),
    });
  }

  async updateDepense(salonId: string, depenseId: string, updates: Partial<Depense>): Promise<Depense> {
    return this.request<Depense>(`/salons/${salonId}/depenses/${depenseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteDepense(salonId: string, depenseId: string): Promise<void> {
    return this.request(`/salons/${salonId}/depenses/${depenseId}`, { method: 'DELETE' });
  }

  // ==================== ADMIN ====================

  async adminGetAllSalons(): Promise<Salon[]> {
    return this.request<Salon[]>('/admin/salons');
  }

  async adminCreateSalon(payload: {
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerPhone?: string;
    salonName: string;
    salonPhone: string;
    salonEmail: string;
    salonAddress: string;
    plan?: string;
    staffList?: Array<{ nom: string; email: string; motDePasse: string; telephone?: string }>;
  }): Promise<{ salon: Salon; owner: Partial<User> }> {
    return this.request<any>('/admin/salons', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async adminUpdateSalonStatus(
    salonId: string,
    updates: {
      isActive?: boolean;
      statutAbonnement?: string;
      plan?: string;
      abonnement?: {
        statut?: string;
        montant?: number;
        dureeJours?: number;
        dateDebut?: string;
        dateFin?: string;
        renouvellementAuto?: boolean;
      };
    }
  ): Promise<Salon> {
    return this.request<Salon>(`/admin/salons/${salonId}/status`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async adminGetStats(): Promise<any> {
    return this.request<any>('/admin/stats');
  }

  // ==================== GROUPES DE CONTACTS ====================

  async getGroupesContacts(salonId: string): Promise<ContactGroup[]> {
    return this.request<ContactGroup[]>(`/salons/${salonId}/groupes-contacts`);
  }

  async createGroupeContact(salonId: string, groupe: Omit<ContactGroup, '_id' | 'createdAt' | 'updatedAt'>): Promise<ContactGroup> {
    return this.request<ContactGroup>(`/salons/${salonId}/groupes-contacts`, {
      method: 'POST',
      body: JSON.stringify(groupe),
    });
  }

  async updateGroupeContact(salonId: string, groupeId: string, updates: Partial<ContactGroup>): Promise<ContactGroup> {
    return this.request<ContactGroup>(`/salons/${salonId}/groupes-contacts/${groupeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteGroupeContact(salonId: string, groupeId: string): Promise<void> {
    return this.request(`/salons/${salonId}/groupes-contacts/${groupeId}`, { method: 'DELETE' });
  }

  // ==================== CAMPAGNES ====================

  async getCampagnes(salonId: string): Promise<Campaign[]> {
    return this.request<Campaign[]>(`/salons/${salonId}/campagnes`);
  }

  async createCampagne(salonId: string, campagne: Omit<Campaign, '_id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
    return this.request<Campaign>(`/salons/${salonId}/campagnes`, {
      method: 'POST',
      body: JSON.stringify(campagne),
    });
  }

  async updateCampagne(salonId: string, campagneId: string, updates: Partial<Campaign>): Promise<Campaign> {
    return this.request<Campaign>(`/salons/${salonId}/campagnes/${campagneId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCampagne(salonId: string, campagneId: string): Promise<void> {
    return this.request(`/salons/${salonId}/campagnes/${campagneId}`, { method: 'DELETE' });
  }

  // ==================== PAYMENTS (PAWAPAY) ====================

  async initiateSubscriptionPayment(payload: {
    salonId?: string;
    email?: string;
    plan: string;
    phone: string;
    operator?: string;
    dureeJours?: number;
  }): Promise<any> {
    const endpoint = payload.salonId ? `/payments/subscribe/${payload.salonId}` : '/payments/subscribe-by-email';
    return this.request<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }


  // ==================== NOTIFICATIONS ====================

  async getNotifications(): Promise<any[]> {
    try {
      return (await this.request<any[]>('/notifications', { method: 'GET' })) || [];
    } catch {
      return [];
    }
  }

  async markNotificationAsRead(id: string): Promise<any> {
    try {
      return await this.request<any>(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      return null;
    }
  }

  async markAllNotificationsAsRead(): Promise<any> {
    try {
      return await this.request<any>('/notifications/read-all', { method: 'PATCH' });
    } catch {
      return null;
    }
  }

  // ==================== UPLOAD ====================

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await this.request<any>('/upload/single', {
      method: 'POST',
      body: formData,
    });
    return res?.url || res?.path || (typeof res === 'string' ? res : '');
  }

  async uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));

    const res = await this.request<any>('/upload/multiple', {
      method: 'POST',
      body: formData,
    });
    return res?.urls || (Array.isArray(res) ? res : []);
  }
}

// Singleton export
export const api = new ApiService();

// ===== Auth API =====
export const authApi = {
  verifyAdmin: async (email: string, password: string): Promise<boolean> => {
    // TODO: Replace with POST /api/auth/admin/login
    return verifyAdminLocal(email, password);
  },

  verifySalonLogin: async (email: string, password: string): Promise<{ salon: SalonAccount; user: import('@/types/auth').SalonUser } | null> => {
    // TODO: Replace with POST /api/auth/salon/login
    return verifySalonLocal(email, password);
  },

  getSession: (): AuthSession | null => {
    // TODO: Replace with token-based session from backend
    return getSessionLocal();
  },

  setSession: (session: AuthSession): void => {
    // TODO: Replace with storing JWT token
    setSessionLocal(session);
  },

  clearSession: (): void => {
    // TODO: Replace with POST /api/auth/logout
    clearSessionLocal();
  },
};

// ===== Salons API =====
export const salonsApi = {
  getAll: async (): Promise<SalonAccount[]> => {
    // TODO: Replace with GET /api/admin/salons
    return getSalonAccounts();
  },

  create: async (data: Parameters<typeof createSalonLocal>[0]): Promise<SalonAccount> => {
    // TODO: Replace with POST /api/admin/salons
    return createSalonLocal(data);
  },

  renew: async (salonId: string): Promise<void> => {
    // TODO: Replace with POST /api/admin/salons/:id/renew
    renewLocal(salonId);
  },

  toggleActive: async (salonId: string, active: boolean): Promise<void> => {
    // TODO: Replace with PATCH /api/admin/salons/:id/active
    toggleLocal(salonId, active);
  },

  isSubscriptionActive: (salon: SalonAccount): boolean => {
    // TODO: Replace with GET /api/salons/:id/subscription
    return checkSubscription(salon);
  },
};

// ===== Tenant Data API =====
// Generic tenant data access — scoped per salon
export function createTenantApi<T>(storageKey: string) {
  return {
    getAll: async (salonId: string | undefined, defaultValue: T[]): Promise<T[]> => {
      // TODO: Replace with GET /api/salons/:salonId/{resource}
      const key = tenantStorageKey(salonId, storageKey);
      return getStorageItem(key, defaultValue);
    },

    save: async (salonId: string | undefined, data: T[]): Promise<void> => {
      // TODO: Replace with PUT /api/salons/:salonId/{resource}
      const key = tenantStorageKey(salonId, storageKey);
      setStorageItem(key, data);
    },
  };
}

// Pre-configured tenant APIs
export const clientsApi = createTenantApi<Client>(STORAGE_KEYS.CLIENTS);
export const prestationsApi = createTenantApi<Prestation>(STORAGE_KEYS.PRESTATIONS);
export const typesPrestationsApi = createTenantApi<TypePrestation>(STORAGE_KEYS.TYPES_PRESTATIONS);
export const produitsApi = createTenantApi<Produit>(STORAGE_KEYS.PRODUITS);
export const ventesApi = createTenantApi<Vente>(STORAGE_KEYS.VENTES);
export const depensesApi = createTenantApi<Depense>(STORAGE_KEYS.DEPENSES);
