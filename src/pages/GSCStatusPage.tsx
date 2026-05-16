import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Loader2, AlertCircle, Search, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "pending" | "processing" | "verified" | "error";
type Stage = "deploy" | "propagation" | "google" | "complete" | null;

interface VerifyResult {
  status: Status;
  stage: Stage;
  message: string;
  tagDetected?: boolean;
  verifiedByGoogle?: boolean;
}

const STAGE_PROGRESS: Record<string, number> = {
  deploy: 15,
  propagation: 45,
  google: 80,
  complete: 100,
};

export default function GSCStatusPage() {
  const [result, setResult] = useState<VerifyResult>({
    status: "pending",
    stage: "deploy",
    message: "Iniciando verificação...",
  });
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke<VerifyResult>('gsc-verify-status');
      if (error) throw error;
      if (data) setResult(data);
      setLastChecked(new Date());
    } catch (err) {
      console.error("Erro ao verificar:", err);
      setResult({
        status: "error",
        stage: null,
        message: "Falha ao conectar com o servidor de verificação.",
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      if (result.status !== "verified") checkStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkStatus, result.status]);

  const progress = result.stage ? STAGE_PROGRESS[result.stage] ?? 10 : 10;
  const { status, stage, tagDetected, verifiedByGoogle } = result;

  const statusIcon = {
    processing: <Loader2 className="w-5 h-5 animate-spin text-primary" />,
    verified: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    pending: <Clock className="w-5 h-5 text-amber-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
  }[status];

  const statusLabel = {
    processing: "Validando com o Google...",
    verified: "Propriedade Verificada!",
    pending: stage === "deploy" ? "Aguardando Deploy" : "Aguardando Propagação",
    error: "Erro de Conexão",
  }[status];

  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-4">
      <Helmet>
        <title>Status SEO em Tempo Real | Titan Loterias</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
          >
            <Search className="w-3 h-3" />
            Google Search Console — Verificação Real
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight">Verificação em Tempo Real</h1>
          <p className="text-muted-foreground">
            Checagem real no backend: deploy, propagação e validação pelo Google.
          </p>
        </div>

        <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {statusIcon} {statusLabel}
              </CardTitle>
              <span className="text-xs text-muted-foreground font-mono">v2.0-BACKEND</span>
            </div>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso Real</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatBox label="Tag no HTML" value={tagDetected ? "DETECTADA" : "Aguardando"} success={!!tagDetected} />
              <StatBox label="Google API" value={verifiedByGoogle ? "VERIFICADA" : "Pendente"} success={!!verifiedByGoogle} />
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                Última Checagem
              </div>
              <div className="text-sm font-medium">{lastChecked.toLocaleTimeString()}</div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Pipeline de Verificação:</h3>
              <ul className="space-y-2">
                <StepItem label="Token solicitado ao Google" completed />
                <StepItem label="Meta tag injetada no index.html" completed />
                <StepItem
                  label="Deploy global ativo (HTML acessível)"
                  completed={stage !== "deploy"}
                  active={stage === "deploy"}
                />
                <StepItem
                  label="Propagação confirmada (tag visível no HTML)"
                  completed={!!tagDetected}
                  active={stage === "propagation"}
                />
                <StepItem
                  label="Google validou a propriedade"
                  completed={!!verifiedByGoogle}
                  active={stage === "google"}
                />
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 border-t border-border/20 pt-6">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={checkStatus}
              disabled={isChecking || status === "verified"}
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Verificando..." : "Verificar Agora"}
            </Button>
            <Button className="w-full gap-2" asChild>
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
                Abrir Search Console <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Voltar para a Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, success }: { label: string; value: string; success: boolean }) {
  return (
    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{label}</div>
      <div className={`text-sm font-bold ${success ? "text-green-500" : "text-amber-500"}`}>{value}</div>
    </div>
  );
}

function StepItem({ label, completed, active }: { label: string; completed?: boolean; active?: boolean }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
        completed ? "bg-green-500/20 border-green-500 text-green-500" :
        active ? "border-primary text-primary animate-pulse" :
        "border-muted text-muted-foreground"
      }`}>
        {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
      </div>
      <span className={completed ? "text-foreground font-medium" : active ? "text-primary font-medium" : "text-muted-foreground"}>
        {label}
      </span>
    </li>
  );
}
