import {
  BarChart3, Sparkles, FlaskConical, History, Zap, Grid3X3,
  Brain, ShieldCheck, Crown, PieChart, TrendingUp, ClipboardCheck, Bot, Lock, Smartphone, MessageCircle, Star,
  Search, Dices, CheckCircle, type LucideIcon
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePlanAccess, type Feature } from "@/hooks/usePlanAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useLotteryContext } from "@/contexts/LotteryContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = { title: string; url: string; icon: LucideIcon; requiredFeature?: Feature; tooltip: string };

const workflowGroups: { label: string; stepNumber: number; items: NavItem[] }[] = [
  {
    label: "Analisar",
    stepNumber: 1,
    items: [
      { title: "Dashboard", url: "/", icon: BarChart3, tooltip: "Visão geral com estatísticas, últimos resultados e resumo da loteria selecionada." },
      { title: "Estatísticas", url: "/estatisticas", icon: PieChart, tooltip: "Frequência, atraso, paridade, soma e distribuição detalhada dos números." },
      { title: "Matriz de Análise", url: "/matriz", icon: Grid3X3, tooltip: "Score inteligente, farol de dezenas e desdobramento automático." },
      { title: "Histórico", url: "/historico", icon: History, tooltip: "Consulte todos os resultados passados dos sorteios." },
    ],
  },
  {
    label: "Simular",
    stepNumber: 2,
    items: [
      { title: "Simulações", url: "/simulacoes", icon: FlaskConical, requiredFeature: "simulacoes", tooltip: "Simule milhares de sorteios e avalie desempenho com Monte Carlo." },
      { title: "Estratégias IA", url: "/estrategias", icon: Brain, requiredFeature: "estrategias_basicas", tooltip: "Explore estratégias como frequência, atraso, Markov e entropia." },
      { title: "ROI", url: "/roi", icon: TrendingUp, requiredFeature: "roi_dashboard", tooltip: "Acompanhe o retorno sobre investimento das suas apostas." },
      { title: "Laboratório", url: "/laboratorio", icon: Search, requiredFeature: "estrategias_ml", tooltip: "Motor autoevolutivo: teste, compare e descubra as melhores estratégias." },
    ],
  },
  {
    label: "Gerar",
    stepNumber: 3,
    items: [
      { title: "Gerador", url: "/gerador", icon: Sparkles, tooltip: "Gere jogos inteligentes com filtros avançados baseados em análise estatística." },
      { title: "Fechamentos", url: "/fechamentos", icon: Grid3X3, requiredFeature: "fechamentos", tooltip: "Crie fechamentos matemáticos (wheeling) com garantia mínima de acertos." },
      { title: "IA Autônoma", url: "/ia-autonoma", icon: Zap, requiredFeature: "ia_autonoma", tooltip: "IA com aprendizado contínuo que analisa padrões e gera previsões evolutivas." },
    ],
  },
  {
    label: "Validar",
    stepNumber: 4,
    items: [
      { title: "AI Analyst", url: "/ai-analyst", icon: Bot, requiredFeature: "ai_analyst", tooltip: "Analista virtual que simula jogos, avalia qualidade e sugere estratégias." },
      { title: "Chat IA", url: "/ai-chat", icon: MessageCircle, tooltip: "Converse com o Titan IA para tirar dúvidas ou pedir análises." },
      { title: "Minhas Apostas", url: "/minhas-apostas", icon: ClipboardCheck, tooltip: "Confira e gerencie o histórico completo das suas apostas." },
      { title: "Jogos Salvos", url: "/jogos-salvos", icon: Star, tooltip: "Veja seus jogos salvos e analise o desempenho deles." },
    ],
  },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  lifetime: "Vitalício",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, isSuperAdmin, trialDaysLeft } = useAuth();
  const { currentPlan, hasAccess, getMinPlan } = usePlanAccess();
  const { config } = useLotteryContext();

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-[#050505]/40 backdrop-blur-3xl">
      <SidebarHeader className="p-4 border-b border-white/5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300 overflow-hidden">
            <img src="/logo.png" alt="Titan Loterias" width="40" height="40" className="w-10 h-10 object-contain" />
          </div>
          {!collapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold tracking-tight text-sidebar-accent-foreground">
                  Titan<span className="gradient-brand-text ml-1">Loterias</span>
                </h1>
                {isAdmin && (
                  <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border animate-pulse ${
                    isSuperAdmin 
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}>
                    {isSuperAdmin ? "GOD" : "ADMIN"}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                Inteligência para Loterias
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Active lottery indicator */}
        <div className={`mx-1 mb-3 rounded-lg bg-primary/5 border border-primary/15 transition-all ${collapsed ? "p-2 flex justify-center" : "px-3 py-2"}`}>
          {collapsed ? (
            <span className="text-lg" title={config.name}>{config.icon}</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-base">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-primary truncate">{config.name}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{config.pick}/{config.numbers}</p>
              </div>
            </div>
          )}
        </div>

        {workflowGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                {group.stepNumber}
              </span>
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const locked = item.requiredFeature ? !hasAccess(item.requiredFeature) : false;
                  const minPlan = item.requiredFeature ? getMinPlan(item.requiredFeature) : null;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end={item.url === "/"}
                              className={`rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-sidebar-accent/60 ${locked ? "text-muted-foreground" : "text-sidebar-foreground"}`}
                              activeClassName="bg-primary/10 text-primary font-semibold glow-green"
                            >
                              <item.icon className="mr-3 h-4 w-4 shrink-0" />
                              {!collapsed && (
                                <>
                                  <span className="flex-1">{item.title}</span>
                                  {locked && <Lock className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />}
                                </>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[250px] text-xs">
                          <p className="font-semibold mb-0.5">{item.title}</p>
                          <p className="text-muted-foreground">{item.tooltip}</p>
                          {locked && (
                            <p className="text-amber-400 mt-1 text-[10px]">🔒 Requer plano {PLAN_LABELS[minPlan!] || "Vitalício"}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Extra */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/install"
                    className="rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-sidebar-accent/60 text-sidebar-foreground"
                    activeClassName="bg-primary/10 text-primary font-semibold glow-green"
                  >
                    <Smartphone className="mr-3 h-4 w-4 shrink-0" />
                    {!collapsed && <span>Instalar App</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      className="rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-sidebar-accent/60 text-sidebar-foreground"
                      activeClassName="bg-primary/10 text-primary font-semibold glow-green"
                    >
                      <ShieldCheck className="mr-3 h-4 w-4 shrink-0" />
                      {!collapsed && <span>Painel Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
          {isAdmin ? (
            <div className={`rounded-lg px-3 py-2.5 text-center ${
              isSuperAdmin ? "bg-amber-500/10 border border-amber-500/25" : "bg-red-500/10 border border-red-500/25"
            }`}>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${isSuperAdmin ? "text-amber-400" : "text-red-400"}`} />
                <p className={`text-xs font-bold uppercase tracking-wider ${isSuperAdmin ? "text-amber-400" : "text-red-400"}`}>
                  {isSuperAdmin ? "Super Admin" : "Modo Admin"}
                </p>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">Acesso irrestrito</p>
            </div>
          ) : (
            <>
              {currentPlan === "free" && trialDaysLeft > 0 && (
                <div className="rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 text-center">
                  <p className="text-[11px] font-semibold text-accent">
                    ⏱ {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Período de teste gratuito</p>
                </div>
              )}
              {currentPlan === "free" && trialDaysLeft <= 0 && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-center">
                  <p className="text-[11px] font-semibold text-destructive">
                    Teste expirado
                  </p>
                  <p className="text-[9px] text-muted-foreground">Assine para continuar</p>
                </div>
              )}
              <Link
                to="/planos"
                className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 hover:bg-primary/10 transition-colors group"
              >
                <Crown className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sidebar-accent-foreground">
                    {currentPlan === "free" ? "Upgrade" : "Vitalício"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {currentPlan === "free" ? "Desbloquear recursos" : "Plano ativo"}
                  </p>
                </div>
              </Link>
            </>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
