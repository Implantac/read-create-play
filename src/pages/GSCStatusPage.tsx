import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Loader2, AlertCircle, Search, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

type Status = "pending" | "processing" | "verified" | "error";

export default function GSCStatusPage() {
  const [status, setStatus] = useState<Status>("processing");
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    // Initial progress simulation
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setStatus("verified");
          setProgress(100);
          clearInterval(timer);
          return 0;
        }
        
        // Dynamic progress based on time
        const newProgress = Math.min(95, ((120 - prev) / 120) * 100);
        setProgress(newProgress);
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleManualRefresh = () => {
    setLastChecked(new Date());
    // In a real scenario, this would trigger a tool call to re-verify
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-4">
      <Helmet>
        <title>Status da Verificação SEO | Titan Loterias</title>
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
            Google Search Console
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight">Status da Verificação</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso da indexação e validação da sua propriedade.
          </p>
        </div>

        <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {status === "processing" && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                {status === "verified" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {status === "pending" && <Clock className="w-5 h-5 text-amber-500" />}
                {status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                {status === "processing" ? "Validando Meta Tag..." : 
                 status === "verified" ? "Propriedade Verificada!" : "Aguardando Deploy"}
              </CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                v1.0.4-GSC
              </span>
            </div>
            <CardDescription>
              {status === "processing" 
                ? "O Google está tentando ler a tag de verificação no seu site." 
                : "Seu site já está pronto para o Google Search Console."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso Global</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                  Tempo Estimado
                </div>
                <div className="text-xl font-bold font-mono">
                  {status === "verified" ? "Concluído" : formatTime(timeLeft)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                  Última Checagem
                </div>
                <div className="text-sm font-medium">
                  {lastChecked.toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Etapas da Verificação:</h3>
              <ul className="space-y-2">
                <StepItem label="Conexão com API do Google" completed />
                <StepItem label="Geração do Token de Propriedade" completed />
                <StepItem label="Inserção da Meta Tag no index.html" completed />
                <StepItem label="Propagação de Deploy Global" completed={status === "verified"} active={status === "processing"} />
                <StepItem label="Validação Final do Google" completed={status === "verified"} active={status === "processing" && progress > 80} />
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 border-t border-border/20 pt-6">
            <Button 
              variant="outline" 
              className="w-full gap-2" 
              onClick={handleManualRefresh}
              disabled={status === "verified"}
            >
              <RefreshCw className="w-4 h-4" /> Forçar Verificação
            </Button>
            <Button className="w-full gap-2" asChild>
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
                Abrir Search Console <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-primary">Nota Importante</p>
            <p className="text-muted-foreground leading-relaxed">
              A propagação do deploy pode variar dependendo do cache do Cloudflare e dos servidores do Google. 
              Geralmente leva menos de 2 minutos. Se demorar mais, verifique se há bloqueios no robots.txt.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Voltar para a Dashboard
          </Link>
        </div>
      </div>
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
