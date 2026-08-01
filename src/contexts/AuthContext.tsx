import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthSession, SalonAccount, SalonUser, buildSession } from '@/types/auth';
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
  loginGoogleWithToken: (token: string, role?: string) => Promise<{ success: boolean; reason?: string }>;
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
      const activeSession = getSession();
      const currentPath = window.location.pathname;

      logout();

      // Only alert "Session expirée" if user was actively logged in on a protected app route
      const isUnauthRoute = currentPath.includes('/login') || currentPath.includes('/pro') || currentPath.includes('/booking') || currentPath.includes('/explorer');
      if (activeSession && !isUnauthRoute) {
        toast({
          title: 'Session expirée',
          description: 'Votre session est arrivée à terme. Veuillez vous reconnecter.',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  // Auto-authenticate via URL token (?token=XYZ) or existing stored JWT token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const error = params.get('error');

    if (error) {
      toast({
        title: "Erreur d'authentification",
        description: "La connexion avec Google a échoué. Veuillez réessayer.",
        variant: 'destructive',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const tokenToUse = urlToken || localStorage.getItem('bf_token');

    if (tokenToUse) {
      if (urlToken) {
        localStorage.setItem('bf_token', urlToken);
      }

      api.getMe().then((res: any) => {
        if (res && (res.user || res.data)) {
          const user = res.user || res.data?.user || res.data;
          const salon = res.salon || res.data?.salon || null;

          const isSalonMissing = user?.role !== 'admin' && user?.role !== 'superadmin' && !salon;

          if (isSalonMissing) {
            clearSession();
            setSessionState(null);
            toast({
              title: "⚠️ Salon Introuvable",
              description: "Aucun salon n'est associé à ce compte. Veuillez créer votre établissement.",
              variant: "destructive"
            });
            return;
          }

          const s = buildSession(user, salon, tokenToUse);
          saveSession(s);
          setSessionState(s);

          const isExpired = salon && (
            salon.statutAbonnement === 'expire' ||
            salon.statutAbonnement === 'inactif' ||
            (salon.dateFin && new Date(salon.dateFin).getTime() < Date.now()) ||
            !isSalonSubscriptionActive(salon)
          );

          if (isExpired) {
            clearSession();
            setSessionState(null);
            toast({
              title: "⚠️ Abonnement Expiré",
              description: "Votre abonnement a expiré. Veuillez le renouveler pour réactiver votre accès salon.",
              variant: "destructive"
            });
          } else if (urlToken) {
            toast({
              title: '✅ Connexion réussie !',
              description: `Bienvenue ${user.nom || user.name || user.email || ''} !`,
            });
          }
        }
      }).catch((err: any) => {
        console.warn('[AUTH] Silent token authentication failed:', err?.message);
        if (urlToken) {
          toast({
            title: "Erreur d'authentification",
            description: "Impossible de récupérer votre profil avec le token fourni.",
            variant: 'destructive',
          });
        }
      }).finally(() => {
        if (urlToken) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, []);

  const currentSalon = session?.type === 'salon' && session.salonId
    ? getSalonAccounts().find(s => s.id === session.salonId) || ({
        id: session.salonId,
        nom: session.userName || 'Mon Salon',
        name: session.userName || 'Mon Salon',
        email: session.email || '',
        telephone: '',
        statutAbonnement: 'actif',
        planAbonnement: 'pro',
        branding: { nom: session.userName || 'Mon Salon' },
        configFidelite: { nombreVisitesSeuil: 10, reductionPourcentage: 20, recompenseDescription: '-20%' }
      } as unknown as SalonAccount)
    : null;

  const currentUser = session?.userId
    ? ((currentSalon?.users || []).find(u => u.id === session.userId) || {
        id: session.userId,
        nom: session.userName || session.email || 'Utilisateur',
        email: session.email || '',
        role: session.userRole || 'owner',
      } as unknown as SalonUser)
    : null;

  const isSubscriptionValid = (() => {
    if (!session || session.type !== 'salon') return false;
    if (!currentSalon) return true;

    const statut = (currentSalon as any).statutAbonnement || (currentSalon as any).status || 'actif';
    if (statut === 'expire' || statut === 'inactif' || statut === 'expired') {
      return false;
    }

    if ((currentSalon as any).dateFin) {
      const expirationDate = new Date((currentSalon as any).dateFin).getTime();
      if (!isNaN(expirationDate) && expirationDate < Date.now()) {
        return false;
      }
    }

    return isSalonSubscriptionActive(currentSalon);
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
    if (typeof api.googleLogin === 'function') {
      api.googleLogin();
    } else {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
      const redirectUrl = `${window.location.origin}/login`;
      window.location.href = `${backendUrl}/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
    }
  }, []);

  const loginGoogleWithToken = useCallback(async (token: string, role?: string): Promise<{ success: boolean; reason?: string }> => {
    try {
      const session = await api.googleLoginWithToken(token, role);
      if (session) {
        saveSession(session);
        setSessionState(session);
        return { success: true };
      }
      return { success: false, reason: 'Échec de l\'authentification Google' };
    } catch (err: any) {
      console.error('[AUTH] Google token login error:', err);
      return { success: false, reason: err?.message || 'Erreur lors de la connexion Google' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      currentSalon,
      currentUser,
      isSubscriptionValid,
      loginAdmin,
      loginSalon,
      loginGoogle,
      loginGoogleWithToken,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
