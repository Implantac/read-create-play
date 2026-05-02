import { useState, useMemo, useCallback } from "react";
import { MatrixRow, generateUnfolding, computeCoverage } from "@/engine/matrix-analysis";
import { LotteryConfig } from "@/data/lotteries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dices, Copy, Sparkles, Check, Info, ShieldCheck, Trophy } from "lucide-react";
import { toast } from "sonner";
import { WHEEL_TEMPLATES, WheelTemplate } from "@/engine/lottery-wheels";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  matrixData: MatrixRow[];
  config: LotteryConfig;
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

export function SmartUnfoldingGenerator({ matrixData, config, onSaveBet }: Props) {
  const defaultBaseCount = Math.min(config.numbers, Math.max(config.pick + 3, 21));
  const [baseCount, setBaseCount] = useState(defaultBaseCount);
  const [maxGames, setMaxGames] = useState(20);
  const [useAutoSuggest, setUseAutoSuggest] = useState(true);
  const [manualSelection, setManualSelection] = useState<number[]>([]);
  const [games, setGames] = useState<number[][]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WheelTemplate | null>(null);

  const suggestedNumbers = useMemo(
    () => matrixData.slice(0, baseCount).map(r => r.number).sort((a, b) => a - b),
    [matrixData, baseCount]
  );

  const baseNumbers = useAutoSuggest ? suggestedNumbers : manualSelection;

  const toggleManual = useCallback((n: number) => {
    setManualSelection(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b)
    );
  }, []);

  const handleGenerate = useCallback(() => {
    if (baseNumbers.length < config.pick) {
      toast.error(`Selecione ao menos ${config.pick} dezenas`);
      return;
    }
    const result = generateUnfolding(baseNumbers, config.pick, maxGames);
    setGames(result);
    toast.success(`${result.length} jogos gerados!`);
  }, [baseNumbers, config.pick, maxGames]);

  const coverage = useMemo(() => computeCoverage(games, baseNumbers), [games, baseNumbers]);

  const copyGame = (game: number[], idx: number) => {
    navigator.clipboard.writeText(game.map(n => String(n).padStart(2, "0")).join(", "));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
    toast.success("Copiado!");
  };

  const copyAll = () => {
    const text = games.map((g, i) =>
      `Jogo ${i + 1}: ${g.map(n => String(n).padStart(2, "0")).join(", ")}`
    ).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Todos os jogos copiados!");
  };

  return (
    <div className="rounded-xl glass-card p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Dices className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Desdobramento Inteligente</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Selecione dezenas e gere jogos equilibrados automaticamente
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={useAutoSuggest ? "default" : "outline"}
            onClick={() => setUseAutoSuggest(true)}
            className="h-8 text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" /> Auto ({baseCount})
          </Button>
          <Button
            size="sm"
            variant={!useAutoSuggest ? "default" : "outline"}
            onClick={() => setUseAutoSuggest(false)}
            className="h-8 text-xs"
          >
            Manual ({manualSelection.length})
          </Button>
        </div>

        {useAutoSuggest && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Dezenas base:</span>
            <input
              type="range"
              min={config.pick}
              max={Math.min(config.numbers, 30)}
              value={baseCount}
              onChange={e => setBaseCount(+e.target.value)}
              className="w-24"
            />
            <span className="font-mono font-bold text-primary">{baseCount}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Jogos:</span>
          <input
            type="range"
            min={1}
            max={50}
            value={maxGames}
            onChange={e => setMaxGames(+e.target.value)}
            className="w-24"
          />
          <span className="font-mono font-bold text-primary">{maxGames}</span>
        </div>

        <Button onClick={handleGenerate} size="sm" className="h-8 text-xs ml-auto">
          <Dices className="w-3 h-3 mr-1" /> Gerar Desdobramento
        </Button>
      </div>

      {/* Manual selection grid */}
      {!useAutoSuggest && (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(config.numbers, 10)}, 1fr)` }}>
          {Array.from({ length: config.numbers }, (_, i) => i + 1).map(n => {
            const selected = manualSelection.includes(n);
            const matrixRow = matrixData.find(r => r.number === n);
            return (
              <button
                key={n}
                onClick={() => toggleManual(n)}
                className={`aspect-square rounded-lg text-xs font-bold font-mono transition-all border ${
                  selected
                    ? "bg-primary/20 border-primary/40 text-primary scale-105"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                }`}
                title={matrixRow ? `Score: ${matrixRow.score}` : ""}
              >
                {String(n).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      )}

      {/* Base numbers preview */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] text-muted-foreground self-center mr-1">Base:</span>
        {baseNumbers.map(n => (
          <span key={n} className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-mono font-bold text-primary">
            {String(n).padStart(2, "0")}
          </span>
        ))}
      </div>

      {/* Generated games */}
      {games.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5" />
            <span>{coverage.totalCombinations} jogos • {coverage.coveredNumbers} dezenas cobertas • Média de repetição: {coverage.avgRepetition}x</span>
            <Button size="sm" variant="outline" onClick={copyAll} className="h-7 text-xs ml-auto">
              <Copy className="w-3 h-3 mr-1" /> Copiar Todos
            </Button>
          </div>

          <div className="grid gap-2 max-h-96 overflow-y-auto pr-1">
            {games.map((game, idx) => (
              <Card key={idx} className="flex items-center gap-3 px-3 py-2 bg-muted/20 border-border">
                <span className="text-[10px] font-mono text-muted-foreground w-12 shrink-0">Jogo {idx + 1}</span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {game.map(n => (
                    <span key={n} className="w-7 h-7 rounded-md bg-primary/10 border border-primary/15 flex items-center justify-center text-[10px] font-mono font-bold text-foreground">
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => copyGame(game, idx)}
                  >
                    {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  {onSaveBet && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        onSaveBet(game, "Desdobramento", undefined, undefined);
                        toast.success(`Jogo ${idx + 1} salvo!`);
                      }}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
