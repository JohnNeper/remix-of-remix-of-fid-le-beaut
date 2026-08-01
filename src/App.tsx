import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PWAInstallPrompt } from "@/components/layout/PWAInstallPrompt";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
// import { AppLayout } from "@/components/layout/AppLayout";

import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import Prestations from "@/pages/Prestations";
import RendezVousPage from "@/pages/RendezVous";
import Fidelite from "@/pages/Fidelite";
import Rappels from "@/pages/Rappels";
import Campagnes from "@/pages/Campagnes";
import Parametres from "@/pages/Parametres";
import Stock from "@/pages/Stock";
import Finances from "@/pages/Finances";
import Bilan from "@/pages/Bilan";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import SubscriptionExpired from "@/pages/SubscriptionExpired";
import BusinessSignup from "@/pages/BusinessSignup";

import PublicBookingLanding from "@/pages/PublicBookingLanding";
import PublicBookingFlow from "@/pages/PublicBookingFlow";
import PublicBookingConfirmation from "@/pages/PublicBookingConfirmation";
import PublicBookingNotFound from "@/pages/PublicBookingNotFound";
import AppLayout from "./components/layout/AppLayout";

const queryClient = new QueryClient();

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session || session.type !== 'admin') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function SalonGuard({ children }: { children: React.ReactNode }) {
  const { session, isSubscriptionValid } = useAuth();
  if (!session || session.type !== 'salon') return <Navigate to="/login" replace />;
  if (isSubscriptionValid === false) return <SubscriptionExpired />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/subscription-expired" element={<SubscriptionExpired />} />

      {/* Business Signup (Waitlist/Pro) */}
      <Route path="/pro" element={<BusinessSignup />} />
      <Route path="/business" element={<Navigate to="/pro" replace />} />

      {/* Public booking (no auth, multi-tenant by slug)
      <Route path="/booking/not-found" element={<PublicBookingNotFound />} />
      <Route path="/booking/:slug" element={<PublicBookingLanding />} />
      <Route path="/booking/:slug/book" element={<PublicBookingFlow />} />
      <Route path="/booking/:slug/confirmation/:ref" element={<PublicBookingConfirmation />} /> */}

      {/* Admin */}
      <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />

      {/* Salon (protected) */}
      <Route element={<SalonGuard><AppLayout /></SalonGuard>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/prestations" element={<Prestations />} />
        <Route path="/rendez-vous" element={<RendezVousPage />} />
        <Route path="/fidelite" element={<Fidelite />} />
        <Route path="/rappels" element={<Rappels />} />
        <Route path="/campagnes" element={<Campagnes />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/finances" element={<Finances />} />
        <Route path="/bilan" element={<Bilan />} />
        <Route path="/parametres" element={<Parametres />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <NotificationProvider>
                <AppRoutes />
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
