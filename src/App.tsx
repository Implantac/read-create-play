import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LotteryProvider } from "@/contexts/LotteryContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminGuard } from "@/components/AdminGuard";

const AppLayout = lazy(() => import("@/components/AppLayout").then((m) => ({ default: m.AppLayout })));
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
const EstatisticasPage = lazy(() => import("@/pages/EstatisticasPage"));
const PerfilPage = lazy(() => import("@/pages/PerfilPage"));
const ROIDashboardPage = lazy(() => import("@/pages/ROIDashboardPage"));
const HistoricoApostasPage = lazy(() => import("@/pages/HistoricoApostasPage"));
const FechamentosPage = lazy(() => import("@/pages/FechamentosPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const SuportePage = lazy(() => import("./pages/SuportePage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<RouteLoader />}>
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

                  {/* Protected */}
                  <Route element={<ProtectedRoute><LotteryProvider><AppLayout /></LotteryProvider></ProtectedRoute>}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/gerador" element={<GeradorPage />} />
                    <Route path="/estrategias" element={<EstrategiasPage />} />
                    <Route path="/simulacoes" element={<SimulacoesPage />} />
                    <Route path="/ia-autonoma" element={<IAAutonomaPage />} />
                    <Route path="/ai-analyst" element={<AIAnalystPage />} />
                    <Route path="/estatisticas" element={<EstatisticasPage />} />
                    <Route path="/fechamentos" element={<FechamentosPage />} />
                    <Route path="/historico" element={<HistoricoPage />} />
                    <Route path="/roi" element={<ROIDashboardPage />} />
                    <Route path="/minhas-apostas" element={<HistoricoApostasPage />} />
                    <Route path="/perfil" element={<PerfilPage />} />
                    <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
