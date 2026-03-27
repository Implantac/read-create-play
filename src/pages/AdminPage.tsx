import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Crown, TrendingUp, Search, Shield, Loader2, RefreshCw, Ban, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  created_at: string;
  blocked: boolean;
}

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

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [drawCount, setDrawCount] = useState(0);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profilesRes, drawsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("lottery_draws").select("id", { count: "exact", head: true }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (drawsRes.count !== null) setDrawCount(drawsRes.count);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updatePlan = async (userId: string, newPlan: string) => {
    setUpdating(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ plan: newPlan, updated_at: new Date().toISOString() } as any)
      .eq("id", userId);
    setUpdating(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, plan: newPlan } : p));
      toast({ title: "Plano atualizado", description: `Plano alterado para ${PLAN_LABELS[newPlan]}.` });
    }
  };

  const toggleBlock = async (userId: string, currentBlocked: boolean) => {
    setUpdating(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ blocked: !currentBlocked, updated_at: new Date().toISOString() } as any)
      .eq("id", userId);
    setUpdating(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, blocked: !currentBlocked } : p));
      toast({
        title: !currentBlocked ? "Usuário bloqueado" : "Usuário desbloqueado",
        description: !currentBlocked ? "O usuário não poderá mais acessar o sistema." : "O acesso do usuário foi restaurado.",
      });
    }
  };

  const filtered = profiles.filter(p =>
    (p.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (p.full_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const planCounts = profiles.reduce((acc, p) => {
    acc[p.plan] = (acc[p.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: "Total Usuários", value: profiles.length, icon: Users, color: "text-primary" },
    { label: "Premium", value: planCounts["premium"] || 0, icon: Crown, color: "text-primary" },
    { label: "Profissional", value: planCounts["professional"] || 0, icon: Shield, color: "text-accent" },
    { label: "Sorteios no BD", value: drawCount, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
          <p className="text-sm text-muted-foreground">Gerencie usuários, planos e métricas</p>
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

      {/* Plan distribution */}
      <Card className="bg-card/60 border-border/50">
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
                  {pct > 10 ? `${PLAN_LABELS[plan]} ${Math.round(pct)}%` : ""}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* User table */}
      <Card className="bg-card/60 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Usuários</CardTitle>
              <CardDescription>{filtered.length} de {profiles.length}</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9"
              />
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className={p.blocked ? "opacity-60" : ""}>
                      <TableCell className="font-medium text-foreground">
                        {p.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={PLAN_COLORS[p.plan] || ""}>
                          {PLAN_LABELS[p.plan] || p.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {p.blocked ? (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="w-3 h-3" /> Bloqueado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-green-500 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Ativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={p.plan}
                            onValueChange={(v) => updatePlan(p.id, v)}
                            disabled={updating === p.id}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              {updating === p.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Gratuito</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="professional">Profissional</SelectItem>
                              <SelectItem value="lifetime">Vitalício</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant={p.blocked ? "outline" : "destructive"}
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => toggleBlock(p.id, p.blocked)}
                            disabled={updating === p.id}
                          >
                            {p.blocked ? (
                              <><CheckCircle2 className="w-3 h-3" /> Desbloquear</>
                            ) : (
                              <><Ban className="w-3 h-3" /> Bloquear</>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
    </div>
  );
}
