/**
 * ClosingConstraintsPanel — permite ativar filtros temáticos (aritméticos,
 * geométricos, estatísticos) e presets prontos. Retorna a lista ativa para o
 * pai aplicar via `applyConstraints` pós-geração.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, Sparkles, RotateCcw } from "lucide-react";
import {
  CONSTRAINT_LIST,
  CONSTRAINT_REGISTRY,
  CONSTRAINT_PRESETS,
  type ActiveConstraint,
  type ConstraintDefinition,
} from "@/engine/closing";

type PresetKey = keyof typeof CONSTRAINT_PRESETS;

const CATEGORY_LABELS: Record<ConstraintDefinition["category"], string> = {
  arithmetic: "Aritméticos",
  geometric: "Geométricos",
  statistical: "Estatísticos",
};

interface Props {
  value: ActiveConstraint[];
  onChange: (next: ActiveConstraint[]) => void;
}

export function ClosingConstraintsPanel({ value, onChange }: Props) {
  const byId = useMemo(() => {
    const m = new Map<string, ActiveConstraint>();
    value.forEach(v => m.set(v.id, v));
    return m;
  }, [value]);

  const isActive = (id: string) => byId.has(id);

  const toggle = (id: string) => {
    if (byId.has(id)) {
      onChange(value.filter(v => v.id !== id));
    } else {
      const def = CONSTRAINT_REGISTRY[id];
      onChange([...value, { id, params: JSON.parse(JSON.stringify(def.defaultParams)) }]);
    }
  };

  const updateParam = (id: string, key: string, val: number) => {
    onChange(value.map(v => v.id === id
      ? { ...v, params: { ...(v.params as Record<string, unknown>), [key]: val } }
      : v));
  };

  const applyPreset = (preset: PresetKey) => {
    onChange(CONSTRAINT_PRESETS[preset].map(c => ({ ...c, params: JSON.parse(JSON.stringify(c.params)) })));
  };

  const clearAll = () => onChange([]);

  const grouped = useMemo(() => {
    const g: Record<string, ConstraintDefinition[]> = { arithmetic: [], geometric: [], statistical: [] };
    for (const def of CONSTRAINT_LIST) g[def.category].push(def);
    return g;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" /> Fechamentos Temáticos
          {value.length > 0 && (
            <Badge variant="secondary" className="ml-2">{value.length} filtro{value.length > 1 ? "s" : ""}</Badge>
          )}
          {value.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearAll} className="ml-auto h-7 px-2 text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Presets:
          </span>
          <Button size="sm" variant="outline" onClick={() => applyPreset("economic")}>Econômico</Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset("guaranteed")}>Garantido</Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset("balanced")}>Balanceado</Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset("hybrid")}>Híbrido</Button>
        </div>

        <Tabs defaultValue="arithmetic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="arithmetic">{CATEGORY_LABELS.arithmetic}</TabsTrigger>
            <TabsTrigger value="geometric">{CATEGORY_LABELS.geometric}</TabsTrigger>
            <TabsTrigger value="statistical">{CATEGORY_LABELS.statistical}</TabsTrigger>
          </TabsList>

          {(["arithmetic", "geometric", "statistical"] as const).map(cat => (
            <TabsContent key={cat} value={cat} className="space-y-2 pt-2">
              {grouped[cat].map(def => {
                const active = byId.get(def.id);
                return (
                  <div key={def.id} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{def.label}</span>
                          {isActive(def.id) && <Badge variant="default" className="h-4 text-[10px] px-1.5">on</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{def.description}</p>
                      </div>
                      <Switch checked={isActive(def.id)} onCheckedChange={() => toggle(def.id)} />
                    </div>
                    {active && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                        {Object.entries(active.params as Record<string, unknown>)
                          .filter(([, v]) => typeof v === "number")
                          .map(([k, v]) => (
                            <div key={k}>
                              <Label className="text-[10px] uppercase text-muted-foreground">{k}</Label>
                              <Input
                                type="number"
                                value={v as number}
                                onChange={e => updateParam(def.id, k, Number(e.target.value) || 0)}
                                className="h-8 text-sm font-mono"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
