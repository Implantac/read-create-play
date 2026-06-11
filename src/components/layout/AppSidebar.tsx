import {
  BarChart3, Sparkles, History, Zap, Grid3X3,
  Brain, ShieldCheck, Crown, PieChart, Lock,
  MessageCircle, User
} from "lucide-react";
import { NavLink } from "@/components/layout/NavLink";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { Feature } from "@/features/auth/constants";
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
import { SystemAuditStatus } from "@/components/lottery/analysis/SystemAuditStatus";

const workflowGroups: { label: string; items: { title: string; url: string; icon: any; requiredFeature?: Feature; tooltip: string; badge?: string }[] }[] = [
  {
    label: "Operacional",
    items: [
      { title: "Dashboard", url: "/", icon: BarChart3, tooltip: "Terminal central de inteligência e resumo de fluxos." },
      { title: "Consultor IA", url: "/ia-chat", icon: MessageCircle, tooltip: "Converse com seu assistente de elite.", badge: "NEW" },
      { title: "Gerador Neural", url: "/gerador", icon: Sparkles, tooltip: "Geração assistida de apostas inteligentes." },
      { title: "Lotofácil Elite", url: "/lotofacil-premium", icon: Crown, tooltip: "Ambiente profissional exclusivo para Lotofácil.", badge: "PREMIUM" },
    ],
  },
  {
    label: "Inteligência",
    items: [
        { title: "Estratégias ML", url: "/estrategias", icon: Brain, tooltip: "Laboratório de estratégias e Machine Learning." },
        { title: "IA Autônoma", url: "/ia-autonoma", icon: Zap, tooltip: "Predição preditiva baseada em redes neurais." },
        { title: "Central Analítica", url: "/analise", icon: PieChart, tooltip: "Estatísticas avançadas, tendências e farol neural." },
        { title: "Fechamentos", url: "/fechamentos", icon: Grid3X3, requiredFeature: "fechamentos", tooltip: "Fechamentos matemáticos de alta performance." },
        { title: "Histórico Unificado", url: "/historico", icon: History, tooltip: "Seus jogos, resultados e auditoria de apostas." },
    ]
  }
];

const accountItems = [
  { title: "Meu Perfil", url: "/perfil", icon: User },
  { title: "Upgrade Vitalício", url: "/planos", icon: Crown },
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
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="p-4 border-b border-border/10 bg-sidebar/50 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xl shadow-primary/20 group-hover:shadow-primary/20 group-hover:scale-105 transition-all duration-700 overflow-hidden border border-white/10 bg-black">
            <span className="text-sm font-black text-white italic tracking-tighter">UM</span>
          </div>
          {!collapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tighter text-sidebar-foreground uppercase italic leading-none">
                  USE<span className="gradient-brand-text ml-0.5">MODA</span>
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
              <p className="text-[9px] text-muted-foreground font-black tracking-[0.3em] uppercase opacity-40 mt-0.5">
                PLM AI • v2.0 Elite
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-6 scrollbar-hide space-y-2">
        {!collapsed && (
          <div className="px-2 mb-6">
            <SystemAuditStatus />
          </div>
        )}

        {/* Active lottery indicator */}
        <div className={`mx-3 mb-10 rounded-[2rem] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 transition-all duration-700 hover:border-primary/50 group/lottery relative overflow-hidden ${collapsed ? "p-3 flex justify-center" : "p-5 shadow-2xl shadow-black/40"}`}>
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/lottery:opacity-100 transition-opacity duration-700" />
          {collapsed ? (
            <span className="text-2xl drop-shadow-lg group-hover/lottery:scale-125 transition-all duration-500 cursor-pointer relative z-10" title={config?.name || "Loto"}>{config?.icon || "🍀"}</span>
          ) : (
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-black/40 border border-primary/20 flex items-center justify-center shrink-0 shadow-lg group-hover/lottery:scale-110 transition-all duration-500">
                <span className="text-3xl drop-shadow-md transition-transform duration-500">{config?.icon || "🍀"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-primary uppercase tracking-[0.05em] truncate leading-none">{config?.name || "Loteria"}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <p className="text-[10px] text-muted-foreground font-bold opacity-60 tracking-widest uppercase italic leading-none">Status: Ativo</p>
                </div>
              </div>
            </div>
          )}
        </div>


        {workflowGroups.map((group) => (
          <SidebarGroup key={group.label} className="px-2">
            <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/50 mb-3 px-4">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const locked = item.requiredFeature ? !hasAccess(item.requiredFeature) : false;
                  const minPlan = item.requiredFeature ? getMinPlan(item.requiredFeature) : null;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild className="h-auto p-0">
                            <NavLink
                              to={item.url}
                              end={item.url === "/"}
                              className={`flex items-center w-full rounded-2xl px-5 py-4 text-sm transition-all duration-500 hover:bg-primary/5 group/item relative overflow-hidden border border-transparent hover:border-primary/10 active:scale-[0.98] ${locked ? "text-muted-foreground/40" : "text-sidebar-foreground font-bold uppercase tracking-tight"}`}
                              activeClassName="bg-primary/15 text-primary font-black shadow-premium shadow-primary/10 border-primary/20 ring-1 ring-primary/10"

                            >
                              <item.icon className="mr-3.5 h-5 w-5 shrink-0 group-hover/item:scale-110 transition-transform duration-300" />
                              {!collapsed && (
                                <>
                                  <span className="flex-1 truncate tracking-tighter">{item.title}</span>
                                  {item.badge && (
                                    <span className="ml-2 px-1.5 py-0.5 text-[8px] font-black bg-primary/20 text-primary border border-primary/20 rounded-md animate-pulse">
                                      {item.badge}
                                    </span>
                                  )}
                                  {locked && <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0 ml-1" />}
                                </>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[260px] text-xs rounded-xl border-border/40 backdrop-blur-md">
                          <p className="font-semibold mb-0.5">{item.title}</p>
                          <p className="text-muted-foreground">{item.tooltip}</p>
                          {locked && (
                            <p className="text-amber-400 mt-1 text-[10px] font-bold">
                              REQUER PLANO {PLAN_LABELS[minPlan!]?.toUpperCase() || "PREMIUM"}
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

        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/50 mb-3 px-4">
            Sistema & Conta
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto p-0">
                    <NavLink
                      to={item.url}
                      className="flex items-center w-full rounded-2xl px-5 py-4 text-sm font-bold uppercase tracking-tight transition-all duration-500 hover:bg-primary/5 text-sidebar-foreground group/item border border-transparent hover:border-primary/10"
                      activeClassName="bg-primary/15 text-primary font-black border-primary/20 shadow-premium shadow-primary/10"

                    >
                      <item.icon className="mr-3.5 h-4 w-4 shrink-0 group-hover/item:scale-110 transition-transform" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-4 border-t border-border/10 bg-secondary/10 space-y-4">
            {currentPlan === "free" && trialDaysLeft > 0 && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-500">
                    ⏱ {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"} restantes
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-1 uppercase font-bold">Período de teste</p>
                </div>
            )}
            
            <Link
                to="/planos"
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 p-4 hover:border-primary/40 transition-all group shadow-xl shadow-primary/5"
            >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 group-hover:rotate-12 transition-transform">
                    <Crown className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-foreground uppercase tracking-tighter">
                    {currentPlan === "free" ? "Upgrade VIP" : "Membro Elite"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-tight">
                    {currentPlan === "free" ? "Acesso Vitalício" : "Acesso Permanente"}
                    </p>
                </div>
            </Link>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
