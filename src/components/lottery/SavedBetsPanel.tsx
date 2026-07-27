import { useSavedBets } from "@/hooks/useSavedBets";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Trash2, Copy, Check, Loader2, Download, FileSpreadsheet, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ShareBetButton } from "@/components/ShareBetButton";
import { LotteryExtraCard } from "@/components/lottery/LotteryExtraCard";
import { exportToCsv, exportToExcel } from "@/utils/export";
import { exportToPdf } from "@/engine/pdf-export";

import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";



export function SavedBetsPanel() {
  const { selectedLottery, config, stats } = useLotteryContext();
  const { savedBets, loading, deleteBet } = useSavedBets(selectedLottery);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const filteredBets = useMemo(() => {
    if (filter === "all") return savedBets;
    return savedBets.filter(b => b.grade === filter);
  }, [savedBets, filter]);

  const statsSummary = useMemo(() => {
    const total = savedBets.length;
    const sGrade = savedBets.filter(b => b.grade === 'S').length;
    const aGrade = savedBets.filter(b => b.grade === 'A').length;
    return { total, sGrade, aGrade };
  }, [savedBets]);

  const qualityAlert = useMemo(() => {
    const lowQualityCount = savedBets.filter(b => b.grade && ['C', 'D', 'F'].includes(b.grade)).length;
    if (lowQualityCount > 0) {
      return {
        count: lowQualityCount,
        message: `${lowQualityCount} aposta(s) no seu portfolio estão com qualidade abaixo do nível TITAN recomendado.`
      };
    }
    return null;
  }, [savedBets]);

  useEffect(() => {
    if (qualityAlert) {
      toast.warning("Alerta de Qualidade", {
        description: qualityAlert.message,
        duration: 5000,
      });
    }
  }, [qualityAlert?.count]);



  const copyBet = (bet: number[], id: string) => {
    navigator.clipboard.writeText(bet.join(" - "));
    setCopied(id);
    toast.success("Aposta copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    const text = savedBets
      .map((b, i) => `#${i + 1}: ${b.numbers.join(" - ")}${b.strategy ? ` (${b.strategy})` : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Todas as apostas copiadas!");
  };

  const handleExportPdf = () => {
    if (savedBets.length === 0) return;
    exportToPdf({
      title: `Portfolio Titan - ${config.name}`,
      subtitle: `${savedBets.length} apostas salvas • ${new Date().toLocaleDateString()}`,
      config,
      bets: savedBets.map(b => ({
        numbers: b.numbers,
        strategy: b.strategy || "Manual",
        score: b.score || 0,
        grade: b.grade || "C"
      })),
      type: "apostas"
    });

    toast.success("PDF exportado com sucesso!");
  };

  const handleExportCsv = () => {
    if (savedBets.length === 0) return;
    const data = savedBets.map((b, i) => [`Ativo ${i + 1}`, ...b.numbers, b.strategy || "", b.score || ""]);
    exportToCsv(`Portfolio_Titan_${config.id}`, data);
    toast.success("CSV exportado!");
  };

  const handleExportExcel = () => {
    if (savedBets.length === 0) return;
    const data = [
      ["ID", "Dezenas", "Estratégia", "Titan Score"],
      ...savedBets.map((b, i) => [`#${i + 1}`, b.numbers.join("-"), b.strategy || "", b.score || ""])
    ];
    exportToExcel(`Portfolio_Titan_${config.id}`, data);
    toast.success("Excel exportado!");
  };


  if (loading) {
    return (
      <div className="rounded-xl glass-card p-5 flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Carregando apostas salvas...</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-card p-6 space-y-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Quick Summary Bar */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
          <p className="text-[8px] font-black uppercase text-muted-foreground">Total</p>
          <p className="text-sm font-black text-foreground">{statsSummary.total}</p>
        </div>
        <div className="p-2 rounded-xl bg-yellow-500/5 border border-yellow-500/10 flex flex-col items-center">
          <p className="text-[8px] font-black uppercase text-yellow-500/60">Rank S</p>
          <p className="text-sm font-black text-yellow-500">{statsSummary.sGrade}</p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center">
          <p className="text-[8px] font-black uppercase text-emerald-500/60">Rank A</p>
          <p className="text-sm font-black text-emerald-500">{statsSummary.aGrade}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-6 transition-transform duration-500">
            <Bookmark className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest italic flex items-center gap-2">
              Portfolio de Ativos
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest opacity-60">
              {savedBets.length} Matrizes Salvas • {config.name}
            </p>
          </div>
        </div>
        {savedBets.length > 0 && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 px-4 rounded-xl border-border/40 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground font-black uppercase tracking-widest text-[9px] transition-all">
                  <Download className="w-3.5 h-3.5 mr-2" /> Exportar Portfolio
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel">
                <DropdownMenuItem onClick={handleExportPdf} className="gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-rose-500" />
                  PDF (Relatório Profissional)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCsv} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  CSV (Dados Puros)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                  Excel (Otimizado)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" variant="outline" onClick={copyAll} className="h-9 px-4 rounded-xl border-border/40 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground font-black uppercase tracking-widest text-[9px] transition-all">
              <Copy className="w-3.5 h-3.5 mr-2" /> Copiar Tudo
            </Button>
          </div>
        )}

      </div>

      <AnimatePresence>
        {qualityAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10"
          >
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-destructive tracking-widest">Alerta de Robustez</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {qualityAlert.message} Recomenda-se otimizar ou substituir por matrizes de Rank S/A.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <LotteryExtraCard lotteryId={selectedLottery} />
      </div>



      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide relative z-10 border-b border-white/5">
        <span className="text-[8px] font-black uppercase text-muted-foreground shrink-0 mr-2">Filtrar por Qualidade:</span>
        {['all', 'S', 'A', 'B', 'C'].map(g => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all shrink-0 border ${
              filter === g 
                ? "bg-primary/20 border-primary text-primary" 
                : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/20"
            }`}
          >
            {g === 'all' ? 'Ver Tudo' : `Rank ${g}`}
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar relative z-10">
          {filteredBets.map((bet, i) => (

            <motion.div
              key={bet.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-secondary/20 border border-border/40 hover:border-primary/40 transition-all duration-300 group/item relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />

              <div className="shrink-0 w-10 relative z-10">
                {bet.grade && (
                  <span className={`text-[10px] font-black italic px-2 py-0.5 rounded-lg border-2 shadow-sm ${
                    bet.grade === "S" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/40 shadow-yellow-400/10" :
                    bet.grade === "A" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/40 shadow-emerald-400/10" :
                    "text-blue-400 bg-blue-400/10 border-blue-400/40 shadow-blue-400/10"
                  }`}>
                    {bet.grade}
                  </span>
                )}
              </div>


              <div className="flex flex-wrap gap-1 flex-1">
                {bet.numbers.map(n => {
                  const stat = stats.find(s => s.number === n);
                  const ballClass =
                    stat?.status === "hot" ? "lottery-ball-hot" :
                    stat?.status === "cold" ? "lottery-ball-cold" : "";
                  return (
                    <span key={n} className={`lottery-ball text-[10px] w-7 h-7 ${ballClass}`}>
                      {String(n).padStart(2, "0")}
                    </span>
                  );
                })}
              </div>

              <div className="shrink-0 text-[10px] text-muted-foreground hidden sm:block">
                {bet.strategy && <span className="truncate max-w-[80px] block">{bet.strategy}</span>}
                {bet.score && <span className="font-mono">{bet.score}pts</span>}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <ShareBetButton numbers={bet.numbers} config={config} strategy={bet.strategy} grade={bet.grade} compact />
                <button
                  onClick={() => copyBet(bet.numbers, bet.id)}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/5"
                >
                  {copied === bet.id ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => deleteBet(bet.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/5 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {savedBets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed border-border/20 rounded-2xl bg-secondary/10 relative z-10">
          <Bookmark className="w-10 h-10 mx-auto mb-4 opacity-20 group-hover:scale-110 transition-transform duration-500" />
          <p className="font-black uppercase tracking-widest text-[10px] opacity-40">Portfolio Vazio</p>
          <p className="text-xs mt-1 px-8 opacity-60">Utilize os geradores de elite para salvar suas matrizes favoritas.</p>
        </div>

      )}
    </div>
  );
}
