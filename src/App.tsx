import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LotteryProvider } from "@/contexts/LotteryContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminGuard } from "@/components/AdminGuard";
import { AppLayout } from "@/components/AppLayout";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

import DashboardPage from "@/pages/DashboardPage";
import GeradorPage from "@/pages/GeradorPage";
import EstrategiasPage from "@/pages/EstrategiasPage";
import SimulacoesPage from "@/pages/SimulacoesPage";
import HistoricoPage from "@/pages/HistoricoPage";
import PlanosPage from "@/pages/PlanosPage";
import AdminPage from "@/pages/AdminPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import IAAutonomaPage from "@/pages/IAAutonomaPage";
import AIAnalystPage from "@/pages/AIAnalystPage";
import AIChatPage from "@/pages/AIChatPage";
import EstatisticasPage from "@/pages/EstatisticasPage";
import PerfilPage from "@/pages/PerfilPage";
import ROIDashboardPage from "@/pages/ROIDashboardPage";
import HistoricoApostasPage from "@/pages/HistoricoApostasPage";
import JogosSalvosPage from "@/pages/JogosSalvosPage";
import FechamentosPage from "@/pages/FechamentosPage";
import StrategyLabPage from "@/pages/StrategyLabPage";
import MatrizAnalisePage from "@/pages/MatrizAnalisePage";
import LandingPage from "./pages/LandingPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import SuportePage from "./pages/SuportePage";
import InstallPage from "./pages/InstallPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
              <Route path="/matriz" element={<MatrizAnalisePage />} />
              <Route path="/fechamentos" element={<FechamentosPage />} />
              <Route path="/historico" element={<HistoricoPage />} />
              <Route path="/roi" element={<ROIDashboardPage />} />
              <Route path="/minhas-apostas" element={<HistoricoApostasPage />} />
              <Route path="/jogos-salvos" element={<JogosSalvosPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/laboratorio" element={<StrategyLabPage />} />
              <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
}

export default App;
