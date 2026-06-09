import type { ClientAccount, ClientVisit } from '@/types/auth';
import { getStorageItem, setStorageItem } from '@/lib/storage';

const CLIENTS_KEY = 'beautyflow_client_accounts';
const SESSION_KEY = 'beautyflow_client_session';

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return 'h_' + Math.abs(h).toString(36);
}

export function getClientAccounts(): ClientAccount[] {
  return getStorageItem<ClientAccount[]>(CLIENTS_KEY, []);
}

export function saveClientAccounts(list: ClientAccount[]): void {
  setStorageItem(CLIENTS_KEY, list);
}

export function getClientSessionId(): string | null {
  return getStorageItem<string | null>(SESSION_KEY, null);
}

export function setClientSession(id: string | null): void {
  if (id) setStorageItem(SESSION_KEY, id);
  else localStorage.removeItem(SESSION_KEY);
}

export function getCurrentClient(): ClientAccount | null {
  const id = getClientSessionId();
  if (!id) return null;
  return getClientAccounts().find(c => c.id === id) || null;
}

export function registerClient(input: { nom: string; email: string; password: string; telephone?: string }): { ok: true; client: ClientAccount } | { ok: false; reason: string } {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 4) return { ok: false, reason: 'Mot de passe trop court (4 caractères min).' };
  const list = getClientAccounts();
  if (list.some(c => c.email.toLowerCase() === email)) return { ok: false, reason: 'Un compte existe déjà avec cet email.' };
  const client: ClientAccount = {
    id: crypto.randomUUID(),
    nom: input.nom.trim() || email.split('@')[0],
    email,
    motDePasse: hash(input.password),
    telephone: input.telephone?.trim() || undefined,
    dateCreation: new Date().toISOString(),
    favorites: [],
    visits: [],
  };
  list.push(client);
  saveClientAccounts(list);
  setClientSession(client.id);
  return { ok: true, client };
}

export function loginClient(email: string, password: string): { ok: true; client: ClientAccount } | { ok: false; reason: string } {
  const e = email.trim().toLowerCase();
  const h = hash(password);
  const list = getClientAccounts();
  const c = list.find(x => x.email.toLowerCase() === e && x.motDePasse === h);
  if (!c) return { ok: false, reason: 'Email ou mot de passe incorrect.' };
  setClientSession(c.id);
  return { ok: true, client: c };
}

export function logoutClient(): void {
  setClientSession(null);
}

export function updateClient(id: string, patch: Partial<ClientAccount>): ClientAccount | null {
  const list = getClientAccounts();
  const i = list.findIndex(c => c.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...patch };
  saveClientAccounts(list);
  return list[i];
}

export function toggleFavorite(clientId: string, salonId: string): ClientAccount | null {
  const list = getClientAccounts();
  const i = list.findIndex(c => c.id === clientId);
  if (i < 0) return null;
  const has = list[i].favorites.includes(salonId);
  list[i].favorites = has ? list[i].favorites.filter(x => x !== salonId) : [...list[i].favorites, salonId];
  saveClientAccounts(list);
  return list[i];
}

export function logVisit(clientId: string, v: Omit<ClientVisit, 'visitedAt'>): void {
  const list = getClientAccounts();
  const i = list.findIndex(c => c.id === clientId);
  if (i < 0) return;
  const visit: ClientVisit = { ...v, visitedAt: new Date().toISOString() };
  // dedupe last visit (same salon within 1h)
  const recent = list[i].visits[0];
  if (recent && recent.salonId === v.salonId && Date.now() - new Date(recent.visitedAt).getTime() < 3600_000) return;
  list[i].visits = [visit, ...list[i].visits].slice(0, 50);
  saveClientAccounts(list);
}