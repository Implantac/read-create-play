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
      { title: "Intelligence Terminal", url: "/", icon: BarChart3, tooltip: "Visão geral com estatísticas, últimos resultados e resumo da loteria selecionada." },
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
  elite: "Elite Cloud",
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
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:border-primary/50 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
            <img src="/logo.png" alt="Titan" width="48" height="48" className="w-10 h-10 object-contain relative z-10" />
          </div>
          {!collapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-[-0.05em] text-white">
                  TITAN<span className="text-primary ml-0.5">TERMINAL</span>
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
              <p className="text-[9px] text-primary/60 font-black tracking-[0.2em] uppercase">
                Neural Data Engine
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Active lottery indicator */}
        <div className={`mx-1 mb-4 rounded-xl bg-white/[0.03] border border-white/5 transition-all ${collapsed ? "p-2 flex justify-center" : "px-3 py-3"}`}>
          {collapsed ? (
            <span className="text-lg" title={config.name}>{config.icon}</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-base">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">{config.name}</p>
                <p className="text-[9px] text-primary font-black opacity-60">ACTIVE STREAM</p>
              </div>
            </div>
          )}
        </div>

        {workflowGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/50 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-black text-primary">
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
                              className={`rounded-xl px-4 py-3 text-[13px] font-bold transition-all duration-500 hover:bg-white/[0.04] border border-transparent hover:border-white/5 ${locked ? "text-muted-foreground/40" : "text-sidebar-foreground"}`}
                              activeClassName="bg-primary/10 text-primary border-primary/20"
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
                className="flex items-center gap-3 rounded-xl bg-primary text-primary-foreground px-4 py-3.5 hover:scale-[1.02] transition-all group shadow-lg shadow-primary/20"
              >
                <Crown className="w-5 h-5 text-white shrink-0 drop-shadow-md" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-widest leading-none">
                    UPGRADE TO PRO
                  </p>
                  <p className="text-[9px] text-primary-foreground/70 font-bold mt-1 uppercase">
                    Neural v4.0 Active
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
