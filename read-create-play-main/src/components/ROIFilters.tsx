import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";

export interface ROIFilterState {
  period: string;
  strategy: string;
  minHits: string;
}

interface ROIFiltersProps {
  filters: ROIFilterState;
  onChange: (filters: ROIFilterState) => void;
  strategies: string[];
  maxHits: number;
}

export function ROIFilters({ filters, onChange, strategies, maxHits }: ROIFiltersProps) {
  const update = (key: keyof ROIFilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-border/40 bg-muted/30">
      <div className="flex items-center gap-2 text-muted-foreground mr-1">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-semibold">Filtros</span>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Período</Label>
        <Select value={filters.period} onValueChange={v => update("period", v)}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Estratégia</Label>
        <Select value={filters.strategy} onValueChange={v => update("strategy", v)}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {strategies.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Min. Acertos</Label>
        <Input
          type="number"
          min={0}
          max={maxHits}
          value={filters.minHits}
          onChange={e => update("minHits", e.target.value)}
          className="h-8 w-[80px] text-xs"
          placeholder="0"
        />
      </div>
    </div>
  );
}
