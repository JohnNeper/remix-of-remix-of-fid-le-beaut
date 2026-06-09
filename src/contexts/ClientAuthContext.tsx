import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ClientAccount, ClientVisit } from '@/types/auth';
import {
  getCurrentClient, registerClient as register, loginClient as login,
  logoutClient, toggleFavorite as toggleFav, logVisit as logV, updateClient,
} from '@/lib/client-auth';

interface Ctx {
  client: ClientAccount | null;
  isAuthenticated: boolean;
  signup: (i: { nom: string; email: string; password: string; telephone?: string }) => { ok: true } | { ok: false; reason: string };
  signin: (email: string, password: string) => { ok: true } | { ok: false; reason: string };
  signout: () => void;
  toggleFavorite: (salonId: string) => void;
  isFavorite: (salonId: string) => boolean;
  logVisit: (v: Omit<ClientVisit, 'visitedAt'>) => void;
  update: (patch: Partial<ClientAccount>) => void;
}

const ClientAuthContext = createContext<Ctx | null>(null);

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<ClientAccount | null>(() => getCurrentClient());

  const signup: Ctx['signup'] = useCallback((i) => {
    const r = register(i);
    if (r.ok) { setClient(r.client); return { ok: true }; }
    return { ok: false, reason: (r as { ok: false; reason: string }).reason };
  }, []);

  const signin: Ctx['signin'] = useCallback((e, p) => {
    const r = login(e, p);
    if (r.ok) { setClient(r.client); return { ok: true }; }
    return { ok: false, reason: (r as { ok: false; reason: string }).reason };
  }, []);

  const signout = useCallback(() => { logoutClient(); setClient(null); }, []);

  const toggleFavorite = useCallback((salonId: string) => {
    if (!client) return;
    const updated = toggleFav(client.id, salonId);
    if (updated) setClient(updated);
  }, [client]);

  const isFavorite = useCallback((salonId: string) => !!client?.favorites.includes(salonId), [client]);

  const logVisit = useCallback((v: Omit<ClientVisit, 'visitedAt'>) => {
    if (!client) return;
    logV(client.id, v);
    setClient(getCurrentClient());
  }, [client]);

  const update = useCallback((patch: Partial<ClientAccount>) => {
    if (!client) return;
    const u = updateClient(client.id, patch);
    if (u) setClient(u);
  }, [client]);

  return (
    <ClientAuthContext.Provider value={{
      client, isAuthenticated: !!client, signup, signin, signout,
      toggleFavorite, isFavorite, logVisit, update,
    }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const c = useContext(ClientAuthContext);
  if (!c) throw new Error('useClientAuth must be used within ClientAuthProvider');
  return c;
}