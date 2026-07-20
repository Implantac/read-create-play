/**
 * ClosingAdaptivePresets — persiste configurações vencedoras do Pipeline Adaptativo
 * no localStorage, permitindo salvar, aplicar e remover presets por modalidade.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bookmark, Trash2, Check, Plus, Download, Upload, Copy } from "lucide-react";
import { toast } from "sonner";

export interface AdaptivePreset {
  id: string;
  name: string;
  lotteryId: string;
  statWeight: number;
  reduce: boolean;
  refine: boolean;
  runs: number;
  createdAt: number;
  meta?: { games?: number; cost?: number; adaptive?: number };
}

const STORAGE_KEY = "titan.adaptive.presets.v1";

function loadAll(): AdaptivePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(list: AdaptivePreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

interface Props {
  lotteryId: string;
  current: { statWeight: number; reduce: boolean; refine: boolean; runs: number };
  meta?: { games?: number; cost?: number; adaptive?: number };
  onApply: (p: AdaptivePreset) => void;
  disabled?: boolean;
}

export function ClosingAdaptivePresets({ lotteryId, current, meta, onApply, disabled }: Props) {
  const [presets, setPresets] = useState<AdaptivePreset[]>([]);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setPresets(loadAll().filter(p => p.lotteryId === lotteryId));
  }, [lotteryId]);

  const save = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Dê um nome ao preset."); return; }
    const all = loadAll();
    const preset: AdaptivePreset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      lotteryId,
      ...current,
      meta,
      createdAt: Date.now(),
    };
    const next = [preset, ...all].slice(0, 40);
    saveAll(next);
    setPresets(next.filter(p => p.lotteryId === lotteryId));
    setName("");
    setAdding(false);
    toast.success(`Preset "${trimmed}" salvo.`);
  }, [name, lotteryId, current, meta]);

  const remove = useCallback((id: string) => {
    const next = loadAll().filter(p => p.id !== id);
    saveAll(next);
    setPresets(next.filter(p => p.lotteryId === lotteryId));
    toast.success("Preset removido.");
  }, [lotteryId]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportPresets = useCallback(() => {
    if (presets.length === 0) { toast.error("Nada para exportar."); return; }
    const payload = {
      kind: "titan.adaptive.presets",
      version: 1,
      lotteryId,
      exportedAt: new Date().toISOString(),
      presets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `titan-presets-${lotteryId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${presets.length} preset(s) exportado(s).`);
  }, [presets, lotteryId]);

  const copyPresets = useCallback(async () => {
    if (presets.length === 0) { toast.error("Nada para copiar."); return; }
    try {
      const payload = { kind: "titan.adaptive.presets", version: 1, lotteryId, presets };
      await navigator.clipboard.writeText(JSON.stringify(payload));
      toast.success("Presets copiados para a área de transferência.");
    } catch {
      toast.error("Falha ao copiar.");
    }
  }, [presets, lotteryId]);

  const importPresets = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming: AdaptivePreset[] = Array.isArray(parsed) ? parsed : parsed?.presets;
        if (!Array.isArray(incoming)) throw new Error("Formato inválido");
        const valid = incoming.filter(p =>
          p && typeof p.name === "string" && typeof p.statWeight === "number"
          && typeof p.reduce === "boolean" && typeof p.refine === "boolean"
          && typeof p.runs === "number",
        );
        if (valid.length === 0) throw new Error("Nenhum preset válido");
        const existing = loadAll();
        const existingKeys = new Set(existing.map(p => `${p.lotteryId}|${p.name}`));
        const normalized: AdaptivePreset[] = valid.map(p => ({
          ...p,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          lotteryId: p.lotteryId || lotteryId,
          createdAt: p.createdAt || Date.now(),
        }));
        const merged = [
          ...normalized.filter(p => !existingKeys.has(`${p.lotteryId}|${p.name}`)),
          ...existing,
        ].slice(0, 80);
        saveAll(merged);
        setPresets(merged.filter(p => p.lotteryId === lotteryId));
        const added = normalized.filter(p => !existingKeys.has(`${p.lotteryId}|${p.name}`)).length;
        toast.success(`${added} preset(s) importado(s)${added < normalized.length ? ` · ${normalized.length - added} duplicado(s) ignorado(s)` : ""}.`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Arquivo inválido.");
      }
    };
    reader.readAsText(file);
  }, [lotteryId]);

  return (
    <div className="rounded-lg border bg-background/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Bookmark className="h-3.5 w-3.5" /> Presets salvos
          {presets.length > 0 && (
            <Badge variant="outline" className="text-[10px]">{presets.length}</Badge>
          )}
        </div>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} disabled={disabled}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Salvar atual
          </Button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Ex.: Lotofácil quente 30%"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setAdding(false); }}
            className="h-8 text-xs"
          />
          <Button size="sm" onClick={save}><Check className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setName(""); }}>Cancelar</Button>
        </div>
      )}

      {presets.length === 0 && !adding && (
        <p className="text-[11px] text-muted-foreground">
          Nenhum preset para esta modalidade. Rode o pipeline e salve a configuração vencedora.
        </p>
      )}

      {presets.length > 0 && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {presets.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.name}</div>
                <div className="flex flex-wrap gap-1 pt-0.5 text-[10px] text-muted-foreground">
                  <span className="font-mono">peso {p.statWeight}%</span>
                  <span>·</span>
                  <span className="font-mono">{p.runs}×</span>
                  {p.reduce && <><span>·</span><span>reduz</span></>}
                  {p.refine && <><span>·</span><span>refino</span></>}
                  {p.meta?.games !== undefined && <><span>·</span><span className="font-mono">{p.meta.games}j</span></>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => onApply(p)} disabled={disabled}>
                  Aplicar
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => remove(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
