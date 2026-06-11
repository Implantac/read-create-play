import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthProvider";
import { LotteryProvider } from "@/contexts/LotteryContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminGuard } from "@/components/AdminGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ReferralSystem } from "@/lib/referral-system";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const GeradorPage = lazy(() => import("@/pages/GeradorPage"));
const FechamentosPage = lazy(() => import("@/pages/FechamentosPage"));
const AnaliseCentralPage = lazy(() => import("@/pages/AnaliseCentralPage"));
const HistoricoUnificadoPage = lazy(() => import("@/pages/HistoricoUnificadoPage"));
const PerfilPage = lazy(() => import("@/pages/PerfilPage"));
const PlanosPage = lazy(() => import("@/pages/PlanosPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const SuportePage = lazy(() => import("./pages/SuportePage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AIChatPage = lazy(() => import("@/pages/AIChatPage"));
const IAAutonomaPage = lazy(() => import("@/pages/IAAutonomaPage"));
const EstrategiasPage = lazy(() => import("@/pages/EstrategiasPage"));
const LotofacilPremiumPage = lazy(() => import("@/pages/LotofacilPremiumPage"));
const NotFound = lazy(() => import("./pages/NotFound"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      gcTime: 15 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-xl bg-background border border-primary/20 flex items-center justify-center shadow-2xl">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-xs font-mono text-primary uppercase tracking-[0.3em] animate-pulse">TITAN LOTERIAS</p>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest opacity-50">Iniciando Neural Core...</p>
      </div>
    </div>
  </div>
);

const AppContent = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) {
      ReferralSystem.trackReferral(ref);
    }
  }, [location]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/planos" element={<PlanosPage />} />
        <Route path="/suporte" element={<SuportePage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/install" element={<InstallPage />} />
        
        {/* Protected */}
        <Route element={<ProtectedRoute><LotteryProvider><AppLayout /></LotteryProvider></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/gerador" element={<GeradorPage />} />
          <Route path="/fechamentos" element={<FechamentosPage />} />
          <Route path="/analise" element={<AnaliseCentralPage />} />
          <Route path="/historico" element={<HistoricoUnificadoPage />} />
          <Route path="/ia-chat" element={<AIChatPage />} />
          <Route path="/ia-autonoma" element={<IAAutonomaPage />} />
          <Route path="/estrategias" element={<EstrategiasPage />} />
          <Route path="/lotofacil-premium" element={<LotofacilPremiumPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
}

export default App;
