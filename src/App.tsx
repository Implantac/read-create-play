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
const EstrategiasPage = lazy(() => import("@/pages/EstrategiasPage"));
const SimulacoesPage = lazy(() => import("@/pages/SimulacoesPage"));
const HistoricoPage = lazy(() => import("@/pages/HistoricoPage"));
const PlanosPage = lazy(() => import("@/pages/PlanosPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const IAAutonomaPage = lazy(() => import("@/pages/IAAutonomaPage"));
const AIAnalystPage = lazy(() => import("@/pages/AIAnalystPage"));
const AIChatPage = lazy(() => import("@/pages/AIChatPage"));
const EstatisticasPage = lazy(() => import("@/pages/EstatisticasPage"));
const PerfilPage = lazy(() => import("@/pages/PerfilPage"));
const ROIDashboardPage = lazy(() => import("@/pages/ROIDashboardPage"));
const HistoricoApostasPage = lazy(() => import("@/pages/HistoricoApostasPage"));
const JogosSalvosPage = lazy(() => import("@/pages/JogosSalvosPage"));
const FechamentosPage = lazy(() => import("@/pages/FechamentosPage"));
const StrategyLabPage = lazy(() => import("@/pages/StrategyLabPage"));
const MatrizAnalisePage = lazy(() => import("@/pages/MatrizAnalisePage"));
const PlanilhasMatrizPage = lazy(() => import("@/pages/PlanilhasMatrizPage"));
const FarolEstatisticoPage = lazy(() => import("@/pages/FarolEstatisticoPage.tsx"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AffiliatePage = lazy(() => import("./pages/AffiliatePage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const SuportePage = lazy(() => import("./pages/SuportePage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
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
        <p className="text-xs font-mono text-primary uppercase tracking-[0.3em] animate-pulse">Titan OS</p>
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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/gerador" element={<GeradorPage />} />
          <Route path="/estrategias" element={<EstrategiasPage />} />
          <Route path="/simulacoes" element={<SimulacoesPage />} />
          <Route path="/ia-autonoma" element={<IAAutonomaPage />} />
          <Route path="/ai-analyst" element={<AIAnalystPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/estatisticas" element={<EstatisticasPage />} />
          <Route path="/farol" element={<FarolEstatisticoPage />} />
          <Route path="/matriz" element={<MatrizAnalisePage />} />
          <Route path="/planilhas-matriz" element={<PlanilhasMatrizPage />} />
          <Route path="/fechamentos" element={<FechamentosPage />} />
          <Route path="/historico" element={<HistoricoPage />} />
          <Route path="/roi" element={<ROIDashboardPage />} />
          <Route path="/minhas-apostas" element={<HistoricoApostasPage />} />
          <Route path="/jogos-salvos" element={<JogosSalvosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/laboratorio" element={<StrategyLabPage />} />
          <Route path="/afiliados" element={<AffiliatePage />} />
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
