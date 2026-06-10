import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import AppLayout from "@/components/layout/AppLayout";
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
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import SubscriptionExpired from "@/pages/SubscriptionExpired";
import NotFound from "./pages/NotFound";
import { PWAInstallPrompt } from "@/components/layout/PWAInstallPrompt";
import PublicBookingLanding from "@/pages/PublicBookingLanding";
import PublicBookingFlow from "@/pages/PublicBookingFlow";
import PublicBookingConfirmation from "@/pages/PublicBookingConfirmation";
import PublicBookingNotFound from "@/pages/PublicBookingNotFound";
import PublicExplorer from "@/pages/PublicExplorer";
import ClientLogin from "@/pages/ClientLogin";
import ClientAccount from "@/pages/ClientAccount";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";

const queryClient = new QueryClient();

function SalonGuard({ children }: { children: React.ReactNode }) {
  const { session, isSubscriptionValid } = useAuth();
  if (!session || session.type !== 'salon') return <Navigate to="/explorer" replace />;
  if (!isSubscriptionValid) return <SubscriptionExpired />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session || session.type !== 'admin') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function SalonProviders({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Client-only experience: discovery + booking */}
      <Route path="/" element={<PublicExplorer />} />
      <Route path="/explorer" element={<Navigate to="/" replace />} />
      <Route path="/explorer/login" element={<ClientLogin />} />
      <Route path="/explorer/account" element={<ClientAccount />} />
      <Route path="/booking/not-found" element={<PublicBookingNotFound />} />
      <Route path="/booking/:slug" element={<PublicBookingLanding />} />
      <Route path="/booking/:slug/book" element={<PublicBookingFlow />} />
      <Route path="/booking/:slug/confirmation/:ref" element={<PublicBookingConfirmation />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <ClientAuthProvider>
              <AppRoutes />
            </ClientAuthProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
