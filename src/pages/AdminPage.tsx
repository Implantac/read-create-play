import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Users, Crown, TrendingUp, Search, Shield, Loader2, RefreshCw, Ban, CheckCircle2,
  ShieldCheck, AlertTriangle, History, UserCog, Eye, Grid3X3, DollarSign,
  ArrowUpRight, Target, FlaskConical, Smartphone, UserPlus
} from "lucide-react";
import { AdminBacktestPanel } from "@/components/admin/AdminBacktestPanel";
import { PWAAnalyticsPanel } from "@/components/admin/PWAAnalyticsPanel";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isFullAccessEmail } from "@/core/fullAccess";
import { Profile, AuditLog, UserRole, UserWithRole } from "@/types/database";
import { profileService } from "@/services/profiles/profileService";
import { adminService } from "@/services/admin/adminService";
import { UserRow } from "@/components/admin/UserRow";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { AccountManager } from "@/components/admin/AccountManager";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  premium: "bg-primary/20 text-primary",
  professional: "bg-accent/20 text-accent",
  lifetime: "bg-yellow-500/20 text-yellow-400",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  premium: "Premium",
  professional: "Profissional",
  lifetime: "Vitalício",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderador",
  user: "Usuário",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  user: "bg-muted text-muted-foreground border-border",
};

export default function AdminPage() {
  const { user, isSuperAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [drawCount, setDrawCount] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [detailUser, setDetailUser] = useState<Profile | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profilesRes, drawsRes, rolesRes, logsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("lottery_draws").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("*"),
      supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (drawsRes.count !== null) setDrawCount(drawsRes.count);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    if (logsRes.data) setAuditLogs(logsRes.data as AuditLog[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getUserRole = (userId: string): string => {
    const profile = profiles.find(p => p.id === userId);
    if (isFullAccessEmail(profile?.email)) return "super_admin";
    const r = roles.find(r => r.user_id === userId);
    return r?.role || "user";
  };

  const logAction = async (action: string, targetUserId: string | null, details: any = {}) => {
    if (!user) return;
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action,
      target_user_id: targetUserId,
      details,
    } as any);
  };

  const countSuperAdmins = (): number => {
    const fullAccessCount = profiles.some(p => isFullAccessEmail(p.email)) ? 1 : 0;
    const roleCount = roles.filter(r => r.role === "super_admin").length;
    return Math.max(fullAccessCount, roleCount);
  };

  const updatePlan = async (userId: string, newPlan: string) => {
    const profile = profiles.find(p => p.id === userId);
    if (isFullAccessEmail(profile?.email) && newPlan !== "lifetime") {
      toast({
        title: "Ação Bloqueada",
        description: "A conta de acesso total é vitalícia e não pode ser rebaixada.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(userId);
    try {
      await adminService.updateUserPlan(userId, newPlan);
      await logAction("plan_changed", userId, { old_plan: profile?.plan, new_plan: newPlan });
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, plan: newPlan } : p));
      toast({ title: "Plano atualizado", description: `Plano alterado para ${PLAN_LABELS[newPlan]}.` });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    const currentRole = getUserRole(userId);
    const profile = profiles.find(p => p.id === userId);

    if (isFullAccessEmail(profile?.email) && newRole !== "super_admin") {
      toast({
        title: "Ação Bloqueada",
        description: "A conta de acesso total deve permanecer como Super Admin.",
        variant: "destructive",
      });
      return;
    }

    if (userId === user?.id && newRole !== "super_admin" && newRole !== "admin") {
      setConfirmDialog({
        open: true,
        title: "⚠️ Ação Perigosa",
        description: "Você está prestes a remover seus próprios privilégios administrativos. Isso pode impedir seu acesso ao painel. Tem certeza?",
        onConfirm: () => executeRoleUpdate(userId, newRole, currentRole),
      });
      return;
    }

    if (currentRole === "super_admin" && newRole !== "super_admin" && countSuperAdmins() <= 1) {
      toast({
        title: "Ação Bloqueada",
        description: "Não é possível remover o último Super Admin do sistema.",
        variant: "destructive",
      });
      return;
    }

    await executeRoleUpdate(userId, newRole, currentRole);
  };

  const executeRoleUpdate = async (userId: string, newRole: string, oldRole: string) => {
    setUpdating(userId);
    setConfirmDialog(prev => ({ ...prev, open: false }));

    try {
      const existingRole = roles.find(r => r.user_id === userId);
      let error;
      
      if (newRole === "user") {
        if (existingRole) {
          const res = await supabase.from("user_roles").delete().eq("user_id", userId);
          error = res.error;
        }
      } else if (existingRole) {
        const res = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
        error = res.error;
      } else {
        const res = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
        error = res.error;
      }

      if (error) throw error;

      await logAction("role_changed", userId, { old_role: oldRole, new_role: newRole });
      
      if (newRole === "user") {
        setRoles(prev => prev.filter(r => r.user_id !== userId));
      } else if (existingRole) {
        setRoles(prev => prev.map(r => (r.user_id === userId ? { ...r, role: newRole as any } : r)));
      } else {
        setRoles(prev => [...prev, { id: crypto.randomUUID(), user_id: userId, role: newRole as any }]);
      }
      toast({ title: "Papel atualizado", description: `Papel alterado para ${ROLE_LABELS[newRole]}.` });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const toggleBlock = async (userId: string, currentBlocked: boolean) => {
    const profile = profiles.find(p => p.id === userId);
    if (isFullAccessEmail(profile?.email)) {
      toast({ title: "Ação Bloqueada", description: "A conta de acesso total não pode ser bloqueada.", variant: "destructive" });
      return;
    }

    if (getUserRole(userId) === "super_admin") {
      toast({ title: "Ação Bloqueada", description: "Não é possível bloquear um Super Admin.", variant: "destructive" });
      return;
    }

    if (userId === user?.id) {
      toast({ title: "Ação Bloqueada", description: "Você não pode bloquear a si mesmo.", variant: "destructive" });
      return;
    }

    setUpdating(userId);
    try {
      await adminService.setUserBlockStatus(userId, !currentBlocked);
      await logAction(currentBlocked ? "user_unblocked" : "user_blocked", userId);
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, blocked: !currentBlocked } : p));
      toast({
        title: !currentBlocked ? "Usuário bloqueado" : "Usuário desbloqueado",
        description: !currentBlocked ? "O usuário não poderá mais acessar o sistema." : "O acesso do usuário foi restaurado.",
      });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const filtered = profiles.filter(p => {
    const isFullAccess = isFullAccessEmail(p.email);
    const effectivePlan = isFullAccess ? "lifetime" : p.plan;
    const effectiveBlocked = isFullAccess ? false : p.blocked;
    const matchesSearch = (p.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.full_name?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesPlan = filterPlan === "all" || effectivePlan === filterPlan;
    const matchesRole = filterRole === "all" || getUserRole(p.id) === filterRole;
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "active" && !effectiveBlocked) ||
      (filterStatus === "blocked" && effectiveBlocked);
    return matchesSearch && matchesPlan && matchesRole && matchesStatus;
  });

  const planCounts = profiles.reduce((acc, p) => {
    const effectivePlan = isFullAccessEmail(p.email) ? "lifetime" : p.plan;
    acc[effectivePlan] = (acc[effectivePlan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);


  const stats = [
    { label: "Total Usuários", value: formatNumber(profiles.length), icon: Users, color: "text-primary" },
    { label: "Premium", value: formatNumber(planCounts["premium"] || 0), icon: Crown, color: "text-primary" },
    { label: "Profissional", value: formatNumber(planCounts["professional"] || 0), icon: Shield, color: "text-accent" },
    { label: "Sorteios no BD", value: formatNumber(drawCount), icon: TrendingUp, color: "text-primary" },
  ];

  const getAdminEmail = (adminId: string) => {
    return profiles.find(p => p.id === adminId)?.email || adminId.slice(0, 8);
  };

  const getTargetEmail = (targetId: string | null) => {
    if (!targetId) return "—";
    return profiles.find(p => p.id === targetId)?.email || targetId.slice(0, 8);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Painel Admin
            {isSuperAdmin && (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase">
                Super Admin
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie usuários, planos, papéis e permissões</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="bg-card/60 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold font-mono text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1">
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5"><UserPlus className="w-4 h-4" /> Contas</TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5"><DollarSign className="w-4 h-4" /> Receita</TabsTrigger>
          <TabsTrigger value="usage" className="gap-1.5"><TrendingUp className="w-4 h-4" /> Uso</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><History className="w-4 h-4" /> Auditoria</TabsTrigger>
          <TabsTrigger value="pwa" className="gap-1.5"><Smartphone className="w-4 h-4" /> PWA</TabsTrigger>
          <TabsTrigger value="backtest" className="gap-1.5"><FlaskConical className="w-4 h-4" /> Backtest</TabsTrigger>
        </TabsList>


        <TabsContent value="accounts">
          <AccountManager profiles={profiles} onChanged={fetchData} />
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="pwa">
          <PWAAnalyticsPanel />
        </TabsContent>
        <TabsContent value="users">
          {/* Plan distribution */}
          <Card className="bg-card/60 border-border/50 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Distribuição de Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 h-6 rounded-full overflow-hidden bg-muted">
                {["free", "premium", "professional", "lifetime"].map(plan => {
                  const pct = profiles.length > 0 ? ((planCounts[plan] || 0) / profiles.length) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={plan}
                      className={`h-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        plan === "free" ? "bg-muted-foreground/30 text-foreground" :
                        plan === "premium" ? "bg-primary text-primary-foreground" :
                        plan === "lifetime" ? "bg-yellow-500 text-yellow-950" :
                        "bg-accent text-accent-foreground"
                      }`}
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 10 ? `${PLAN_LABELS[plan]} ${formatNumber(Math.round(pct))}%` : ""}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* User table */}
          <Card className="bg-card/60 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Usuários</CardTitle>
                  <CardDescription>{formatNumber(filtered.length)} de {formatNumber(profiles.length)}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-52">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-[120px] h-9 text-xs">
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos planos</SelectItem>
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="lifetime">Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[120px] h-9 text-xs">
                      <SelectValue placeholder="Papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos papéis</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[110px] h-9 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="blocked">Bloqueados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(p => (
                        <UserRow
                          key={p.id}
                          profile={p}
                          role={getUserRole(p.id)}
                          isUpdating={updating === p.id}
                          onUpdatePlan={updatePlan}
                          onUpdateRole={updateRole}
                          onToggleBlock={toggleBlock}
                          onViewDetails={setDetailUser}
                          planLabels={PLAN_LABELS}
                          planColors={PLAN_COLORS}
                          roleLabels={ROLE_LABELS}
                          roleColors={ROLE_COLORS}
                        />
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum usuário encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROLES TAB */}
        <TabsContent value="roles">
          <Card className="bg-card/60 border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Hierarquia de Papéis (RBAC)
              </CardTitle>
              <CardDescription>Sistema de controle de acesso baseado em papéis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { role: "super_admin", desc: "Acesso absoluto e irrestrito. Gerencia todos os usuários, papéis, planos e configurações. Nunca é limitado pelo plano comercial.", icon: "👑", count: countSuperAdmins() },
                  { role: "admin", desc: "Acesso administrativo amplo. Pode gerenciar usuários e visualizar métricas. Limitado por definições do Super Admin.", icon: "🛡️", count: roles.filter(r => r.role === "admin").length },
                  { role: "moderator", desc: "Acesso gerencial. Pode visualizar dados e moderar conteúdo. Sem acesso a configurações críticas.", icon: "⚙️", count: roles.filter(r => r.role === "moderator").length },
                  { role: "user", desc: "Acesso padrão controlado pelo plano comercial (Gratuito, Premium, Profissional, Vitalício).", icon: "👤", count: profiles.filter(p => getUserRole(p.id) === "user").length },
                ].map(item => (
                  <Card key={item.role} className="bg-card/40 border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={ROLE_COLORS[item.role]}>
                              {ROLE_LABELS[item.role]}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">{item.count} usuário(s)</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Precedência de Acesso</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Super Admin → Admin → Moderador → Plano Comercial → Usuário Padrão.
                      <br />
                      O papel administrativo <strong>sempre</strong> tem prioridade sobre o plano comercial.
                      Um Super Admin com plano "Gratuito" mantém acesso total e irrestrito.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVENUE TAB */}
        <TabsContent value="revenue">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card/60 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Receita Recorrente Est. (MRR)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-foreground">R$ {formatNumber((planCounts["premium"] || 0) * 49 + (planCounts["professional"] || 0) * 97)}</p>
                <div className="flex items-center gap-1 text-emerald-400 text-[10px] mt-1 font-bold">
                  <ArrowUpRight className="w-3 h-3" /> +12.4% este mês
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Conversão Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-foreground">{formatNumber(((planCounts["premium"] || 0) / profiles.length) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">Meta: 15%</p>
              </CardContent>
            </Card>
            <Card className="bg-card/60 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">LTV Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-foreground">R$ 342,00</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">Base: 12 meses</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* USAGE TAB */}
        <TabsContent value="usage">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/60 border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-primary" />
                  Fechamentos mais Utilizados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "PLAN 21X50", usage: 42, growth: 15 },
                  { name: "PLAN GF (Titan)", usage: 38, growth: 24 },
                  { name: "PLAN 19X5", usage: 20, growth: -5 },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{item.usage}% de uso total</p>
                    </div>
                    <Badge variant="outline" className={item.growth > 0 ? "text-emerald-400 border-emerald-400/20" : "text-rose-400 border-rose-400/20"}>
                      {item.growth > 0 ? "+" : ""}{item.growth}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="bg-card/60 border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  Taxa de Retenção (Churn)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364.4" strokeDashoffset="14.5" className="text-primary" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-foreground">96%</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">Retenção</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 text-center px-6">"Titan Loterias v5.0 aumentou a retenção em 14% via Gamificação e FAROL."</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">

          <Card className="bg-card/60 border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Log de Auditoria
              </CardTitle>
              <CardDescription>Últimas 100 ações administrativas</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum registro de auditoria encontrado.</p>
              ) : (
                <AuditLogTable
                  logs={auditLogs}
                  getAdminEmail={getAdminEmail}
                  getTargetEmail={getTargetEmail}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backtest">
          <AdminBacktestPanel />
        </TabsContent>
      </Tabs>


      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDialog.onConfirm}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={(o) => !o && setDetailUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Detalhes do Usuário
            </DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{detailUser.full_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{detailUser.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{detailUser.phone_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Papel</p>
                  <Badge variant="outline" className={ROLE_COLORS[getUserRole(detailUser.id)]}>
                    {ROLE_LABELS[getUserRole(detailUser.id)]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plano</p>
                  <Badge className={PLAN_COLORS[isFullAccessEmail(detailUser.email) ? "lifetime" : detailUser.plan]}>
                    {PLAN_LABELS[isFullAccessEmail(detailUser.email) ? "lifetime" : detailUser.plan]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={!isFullAccessEmail(detailUser.email) && detailUser.blocked ? "destructive" : "outline"}
                    className={!isFullAccessEmail(detailUser.email) && detailUser.blocked ? "" : "text-green-500 border-green-500/30"}
                  >
                    {!isFullAccessEmail(detailUser.email) && detailUser.blocked ? "Bloqueado" : "Ativo"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cadastro</p>
                  <p className="font-mono text-xs">{new Date(detailUser.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="font-mono text-[10px] break-all">{detailUser.id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
