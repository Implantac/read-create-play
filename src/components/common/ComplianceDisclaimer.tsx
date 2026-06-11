import { AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  compact?: boolean;
}

export function ComplianceDisclaimer({ compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15 text-[10px] text-amber-600 dark:text-amber-400">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        <span>Análise estatística — sem garantia de premiação.</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/15"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <ShieldCheck className="w-4 h-4 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          Aviso de Transparência
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Análises baseadas em dados históricos, estatística, probabilidade e inteligência artificial.
          <strong className="text-foreground"> Não há garantia de premiação.</strong> Este é um sistema de suporte à decisão profissional. Jogue com responsabilidade.
        </p>
      </div>
    </motion.div>
  );
}
