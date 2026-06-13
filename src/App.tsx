import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PWAInstallPrompt } from "@/components/layout/PWAInstallPrompt";
import PublicBookingLanding from "@/pages/PublicBookingLanding";
import PublicBookingFlow from "@/pages/PublicBookingFlow";
import PublicBookingConfirmation from "@/pages/PublicBookingConfirmation";
import PublicBookingNotFound from "@/pages/PublicBookingNotFound";
import PublicExplorer from "@/pages/PublicExplorer";
import BusinessSignup from "@/pages/BusinessSignup";
import ClientLogin from "@/pages/ClientLogin";
import ClientAccount from "@/pages/ClientAccount";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      {/* Client-only experience: discovery + booking */}
      <Route path="/" element={<PublicExplorer />} />
      <Route path="/explorer" element={<Navigate to="/" replace />} />
      <Route path="/pro" element={<BusinessSignup />} />
      <Route path="/business" element={<Navigate to="/pro" replace />} />
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
          <ClientAuthProvider>
            <AppRoutes />
          </ClientAuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
