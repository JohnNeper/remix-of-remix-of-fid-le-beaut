import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthSession, SalonAccount, SalonUser } from '@/types/auth';
import { api } from '@/lib/api';
import {
  getSession,
  setSession as saveSession,
  clearSession,
  verifyAdmin,
  verifySalonLogin,
  isSalonSubscriptionActive,
  getSalonAccounts,
} from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  session: AuthSession | null;
  currentSalon: SalonAccount | null;
  currentUser: SalonUser | null;
  isSubscriptionValid: boolean;
  loginAdmin: (email: string, password: string) => boolean;
  loginSalon: (email: string, password: string) => Promise<{ success: boolean; reason?: string; isSubscriptionExpired?: boolean }>;
  loginGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession());

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  // Listen for 401 Unauthorized API responses
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('[AUTH] Unauthorized 401 response detected → auto-logout');
      logout();
      toast({
        title: 'Session expirée',
        description: 'Votre session est arrivée à terme. Veuillez vous reconnecter.',
        variant: 'destructive',
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const currentSalon = session?.type === 'salon' && session.salonId
    ? getSalonAccounts().find(s => s.id === session.salonId) || null
    : null;

  const currentUser = currentSalon && session?.userId
    ? (currentSalon.users || []).find(u => u.id === session.userId) || null
    : null;

  const isSubscriptionValid = (() => {
    if (!session || session.type !== 'salon') return false;
    if (currentSalon) return isSalonSubscriptionActive(currentSalon);
    return true;
  })();

  const loginAdmin = useCallback((email: string, password: string): boolean => {
    if (verifyAdmin(email, password)) {
      const s: AuthSession = { type: 'admin', email, timestamp: Date.now() };
      saveSession(s);
      setSessionState(s);
      return true;
    }
    return false;
  }, []);

  const loginSalon = useCallback(async (email: string, password: string): Promise<{ success: boolean; reason?: string; isSubscriptionExpired?: boolean }> => {
    // 1. Try real REST API backend login (http://localhost:3000/api/auth/login)
    try {
      const apiSession = await api.login({ email, password });
      if (apiSession) {
        saveSession(apiSession);
        setSessionState(apiSession);
        return { success: true };
      }
    } catch (apiError: any) {
      console.warn('[AUTH] Backend API login response:', apiError?.message);

      const msg: string = apiError?.message || '';
      const isExpired = msg.toLowerCase().includes('expiré') || msg.toLowerCase().includes('abonnement');
      const isNetworkError = !msg || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED') || msg.includes('Network Error');

      // If backend responded with an HTTP response error (e.g. 403 Abonnement expiré or 401 Identifiants incorrects), return it immediately
      if (!isNetworkError) {
        return {
          success: false,
          reason: msg || 'Identifiants incorrects',
          isSubscriptionExpired: isExpired,
        };
      }
    }

    // 2. Fallback to local accounts (only if network is offline)
    const result = verifySalonLogin(email, password);
    if (!result) return { success: false, reason: 'Identifiants incorrects' };
    if (!isSalonSubscriptionActive(result.salon)) {
      return {
        success: false,
        reason: 'Votre abonnement a expiré. Contactez le support BeautyFlow pour le renouvellement.',
        isSubscriptionExpired: true,
      };
    }

    const s: AuthSession = {
      type: 'salon',
      salonId: result.salon.id,
      userId: result.user.id,
      userRole: result.user.role,
      userName: result.user.nom,
      email,
      timestamp: Date.now(),
    };
    saveSession(s);
    setSessionState(s);
    return { success: true };
  }, []);

  const loginGoogle = useCallback(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
    window.location.href = `${backendUrl}/auth/google`;
  }, []);

  return (
    <AuthContext.Provider value={{ session, currentSalon, currentUser, isSubscriptionValid, loginAdmin, loginSalon, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
