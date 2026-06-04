import {
  BarChart3, Sparkles, FlaskConical, History, Zap, Grid3X3,
  Brain, ShieldCheck, Crown, PieChart, TrendingUp, ClipboardCheck, Bot, Lock,
  Smartphone, MessageCircle, Star, Search, User, FileSpreadsheet, Share2
} from "lucide-react";
import { NavLink } from "@/components/layout/NavLink";
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
import { SystemAuditStatus } from "@/components/SystemAuditStatus";

const workflowGroups: { label: string; items: { title: string; url: string; icon: any; requiredFeature?: Feature; tooltip: string }[] }[] = [
  {
    label: "Inteligência de Dados",
    items: [
      { title: "Terminal", url: "/", icon: BarChart3, tooltip: "Terminal central de inteligência e resumo de fluxos históricos." },
      { title: "Padrões Históricos", url: "/estatisticas", icon: PieChart, tooltip: "Frequência, desvio padrão e análise consolidada de tendências." },
      { title: "Matriz de Precisão", url: "/matriz", icon: Grid3X3, tooltip: "Score algorítmico e farol de saturação de dezenas." },
      { title: "Database Global", url: "/historico", icon: History, tooltip: "Acesso total à base de dados histórica sincronizada." },
    ],
  },
  {
    label: "Laboratório de Estratégias",
    items: [
      { title: "Engine de Simulação", url: "/simulacoes", icon: FlaskConical, requiredFeature: "simulacoes", tooltip: "Execução massiva de cenários via Monte Carlo." },
      { title: "Modelos de ML", url: "/estrategias", icon: Brain, requiredFeature: "estrategias_basicas", tooltip: "Estratégias orientadas por Machine Learning." },
      { title: "Analytics ROI", url: "/roi", icon: TrendingUp, requiredFeature: "roi_dashboard", tooltip: "Monitoramento de performance financeira e retorno." },
      { title: "Strategy Lab", url: "/laboratorio", icon: Search, requiredFeature: "estrategias_ml", tooltip: "Ambiente de testes para otimização de estratégias." },
    ],
  },
  {
    label: "Otimização Combinatorial",
    items: [
      { title: "Otimizador de Matrizes", url: "/gerador", icon: Sparkles, tooltip: "Geração de matrizes otimizadas com algoritmos de elite." },
      { title: "Planilhas Matriz", url: "/planilhas-matriz", icon: FileSpreadsheet, requiredFeature: "fechamentos", tooltip: "Modelos tipo planilha Farol: 21x50, 19x5, 17x8, 13x6 e conferidor." },
      { title: "Fechamentos HP", url: "/fechamentos", icon: Grid3X3, requiredFeature: "fechamentos", tooltip: "Fechamentos de alta performance com garantia matemática." },
      { title: "IA Autônoma v4", url: "/ia-autonoma", icon: Zap, requiredFeature: "ia_autonoma", tooltip: "Sistema neural autônomo para detecção de anomalias." },
    ],
  },
  {
    label: "Validação & Auditoria",
    items: [
      { title: "AI Analyst Pro", url: "/ai-analyst", icon: Bot, requiredFeature: "ai_analyst", tooltip: "Analista de precisão para auditoria de jogos e estratégias." },
      { title: "Interface Neural", url: "/ai-chat", icon: MessageCircle, tooltip: "Prompt direto para consulta à base de conhecimento Titan." },
      { title: "Registro de Fluxos", url: "/minhas-apostas", icon: ClipboardCheck, tooltip: "Histórico completo de auditoria das suas apostas." },
      { title: "Portfolio de Jogos", url: "/jogos-salvos", icon: Star, tooltip: "Gerenciamento de ativos salvos e performance acumulada." },
    ],
  },
];

const accountItems = [
  { title: "Meu Perfil", url: "/perfil", icon: User },
  { title: "Planos", url: "/planos", icon: Crown },
  { title: "Suporte", url: "/suporte", icon: MessageCircle },
  { title: "Instalar App", url: "/install", icon: Smartphone },
  { title: "Indique e Ganhe", url: "/afiliados", icon: Share2 },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  premium: "Premium",
  professional: "Profissional",
  lifetime: "Vitalício",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, isSuperAdmin, trialDaysLeft } = useAuth();
  const { currentPlan, hasAccess, getMinPlan } = usePlanAccess();
  const { config } = useLotteryContext();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300 overflow-hidden">
            <img src="/logo.png" alt="Titan Loterias" className="w-10 h-10 object-contain" />
          </div>
          {!collapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tighter text-sidebar-accent-foreground uppercase italic">
                  Titan<span className="gradient-brand-text ml-0.5">Loterias</span>
                </h1>
                {isAdmin && (
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border animate-pulse ${

                    isSuperAdmin 
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}>
                    {isSuperAdmin ? "GOD" : "ADMIN"}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground font-black tracking-[0.3em] uppercase opacity-40">
                Neural Core v5.3
              </p>


            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 scrollbar-hide">
        {!collapsed && (
          <div className="px-2 mb-4">
            <SystemAuditStatus />
          </div>
        )}
        {/* Active lottery indicator */}
        <div className={`mx-2 mb-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 transition-all duration-500 hover:border-primary/40 group/lottery ${collapsed ? "p-2.5 flex justify-center" : "px-4 py-3"}`}>
          {collapsed ? (
            <span className="text-xl drop-shadow-md group-hover/lottery:scale-110 transition-transform" title={config?.name || "Loto"}>{config?.icon || "🍀"}</span>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-background/50 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner group-hover/lottery:rotate-6 transition-transform duration-500">
                <span className="text-xl drop-shadow-sm">{config?.icon || "🍀"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-primary uppercase tracking-wider truncate">{config?.name || "Loteria"}</p>
                <p className="text-[9px] text-muted-foreground font-mono font-bold opacity-60 tracking-tight">{config?.pick || 0} / {config?.numbers || 0}</p>
              </div>
            </div>
          )}
        </div>


        {workflowGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
              {group.label}
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
                              className={`rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:bg-primary/10 group/item relative overflow-hidden ${locked ? "text-muted-foreground/40" : "text-sidebar-foreground/80"}`}
                              activeClassName="bg-primary/20 text-primary font-black shadow-[0_0_25px_rgba(var(--primary),0.2)] border-l-4 border-primary ring-1 ring-primary/20"
                            >

                              <item.icon className="mr-3 h-4 w-4 shrink-0" />
                              {!collapsed && (
                                <>
                                  <span className="flex-1">{item.title}</span>
                                  {locked && <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0 ml-1" />}
                                </>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[260px] text-xs">
                          <p className="font-semibold mb-0.5">{item.title}</p>
                          <p className="text-muted-foreground">{item.tooltip}</p>
                          {locked && (
                            <p className="text-amber-400 mt-1 text-[10px]">
                              Requer plano {PLAN_LABELS[minPlan!] || "Premium"}
                            </p>
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
            Conta e suporte
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:bg-primary/10 text-sidebar-foreground/80 group/item"
                      activeClassName="bg-primary/20 text-primary font-black shadow-[0_0_25px_rgba(var(--primary),0.2)] border-l-4 border-primary ring-1 ring-primary/20"
                    >

                      <item.icon className="mr-3 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      className="rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:bg-primary/10 text-sidebar-foreground/80 group/item"
                      activeClassName="bg-primary/20 text-primary font-black shadow-[0_0_25px_rgba(var(--primary),0.2)] border-l-4 border-primary ring-1 ring-primary/20"
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
                    {currentPlan === "free" ? "Upgrade Vitalício" : "Vitalício"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {currentPlan === "free" ? "Desbloquear Vitalício" : "Plano Vitalício Ativo"}
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
