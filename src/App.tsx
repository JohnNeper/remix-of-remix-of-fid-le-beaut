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

const queryClient = new QueryClient();

function SalonGuard({ children }: { children: React.ReactNode }) {
  const { session, isSubscriptionValid } = useAuth();
  if (!session || session.type !== 'salon') return <Navigate to="/login" replace />;
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
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />

      {/* Salon (protected) */}
      <Route element={<SalonGuard><SalonProviders><AppLayout /></SalonProviders></SalonGuard>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/prestations" element={<Prestations />} />
        <Route path="/rendez-vous" element={<RendezVousPage />} />
        <Route path="/fidelite" element={<Fidelite />} />
        <Route path="/rappels" element={<Rappels />} />
        <Route path="/campagnes" element={<Campagnes />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/finances" element={<Finances />} />
        <Route path="/parametres" element={<Parametres />} />
      </Route>

      <Route path="*" element={<NotFound />} />
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
            <AppRoutes />
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
