import { motion } from "framer-motion";
import { Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title?: string;
  description?: string;
  onImport?: () => void;
  onImportAll?: () => void;
  lotteryName?: string;
  syncing?: boolean;
}

export function EmptyState({ title = "Banco de dados vazio", description, onImport, onImportAll, lotteryName, syncing }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl glass-card p-10 text-center space-y-4 border border-dashed border-border/50"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <Database className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {description || "Importe os sorteios históricos da API para começar a análise."}
        </p>
      </div>
      {onImport && (
        <div className="flex gap-2 justify-center pt-2">
          <Button onClick={() => void onImport()} disabled={syncing} className="gap-2 gradient-brand text-primary-foreground shadow-lg shadow-primary/20">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Importar {lotteryName}
          </Button>
          {onImportAll && (
            <Button onClick={() => void onImportAll()} disabled={syncing} variant="outline" className="gap-2 border-border/50">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Importar Todas
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
