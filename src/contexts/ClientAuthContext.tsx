import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ClientAccount, ClientVisit } from '@/types/auth';
import { api } from '@/lib/api';

const getStoredToken = () => localStorage.getItem('app_user_token');
const setStoredToken = (t: string) => localStorage.setItem('app_user_token', t);
const clearStoredToken = () => localStorage.removeItem('app_user_token');
const getStoredClient = () => {
  try {
    const c = localStorage.getItem('app_user_data');
    return c ? JSON.parse(c) : null;
  } catch {
    return null;
  }
};
const setStoredClient = (c: any) => localStorage.setItem('app_user_data', JSON.stringify(c));
const clearStoredClient = () => localStorage.removeItem('app_user_data');

interface Ctx {
  client: ClientAccount | null;
  isAuthenticated: boolean;
  signup: (i: { nom: string; email: string; password: string; telephone?: string }) => Promise<{ ok: true } | { ok: false; reason: string }>;
  signin: (email: string, password: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  signout: () => void;
  toggleFavorite: (salonId: string) => Promise<void>;
  isFavorite: (salonId: string) => boolean;
  logVisit: (v: Omit<ClientVisit, 'visitedAt'>) => void;
  update: (patch: Partial<ClientAccount>) => void;
  token: string | null;
}

const ClientAuthContext = createContext<Ctx | null>(null);

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<any | null>(() => getStoredClient());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const signup: Ctx['signup'] = useCallback(async (i) => {
    try {
      const dummyClient = { id: crypto.randomUUID(), nom: i.nom, email: i.email, telephone: i.telephone };
      setClient(dummyClient);
      setStoredClient(dummyClient);
      return { ok: true };
    } catch(e: any) { return { ok: false, reason: e.message }; }
  }, []);

  const signin: Ctx['signin'] = useCallback(async (e, p) => {
    try {
      const dummyClient = { id: crypto.randomUUID(), nom: e.split('@')[0], email: e };
      setClient(dummyClient);
      setStoredClient(dummyClient);
      return { ok: true };
    } catch(e: any) { return { ok: false, reason: e.message }; }
  }, []);

  const signout = useCallback(() => { 
    clearStoredToken(); clearStoredClient(); setClient(null); setToken(null); 
  }, []);

  const toggleFavorite = useCallback(async (salonId: string) => {
    if (!client || !salonId) return;
    const currentFavs: string[] = client.favoris || [];
    const nextFavs = currentFavs.includes(salonId)
      ? currentFavs.filter(id => id !== salonId)
      : [...currentFavs, salonId];
    const updated = { ...client, favoris: nextFavs };
    setClient(updated);
    setStoredClient(updated);
  }, [client]);

  const isFavorite = useCallback((salonId: string) => {
    if (!client || !client.favoris || !salonId) return false;
    return client.favoris.some((f: any) => (f._id || f) === salonId);
  }, [client]);

  const logVisit = useCallback((v: Omit<ClientVisit, 'visitedAt'>) => {
    // not used strictly anymore
  }, []);

  const update = useCallback(async (patch: Partial<ClientAccount>) => {
    if (!client) return;
    const updated = { ...client, ...patch };
    setClient(updated);
    setStoredClient(updated);
  }, [client]);

  return (
    <ClientAuthContext.Provider value={{
      client, isAuthenticated: !!client, signup, signin, signout,
      toggleFavorite, isFavorite, logVisit, update, token
    }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const c = useContext(ClientAuthContext);
  if (!c) {
    // Fallback if not inside provider
    return {
      client: getStoredClient(),
      isAuthenticated: !!getStoredClient(),
      signup: async () => ({ ok: true as const }),
      signin: async () => ({ ok: true as const }),
      signout: () => {},
      toggleFavorite: async () => {},
      isFavorite: () => false,
      logVisit: () => {},
      update: () => {},
      token: getStoredToken(),
    };
  }
  return c;
}
