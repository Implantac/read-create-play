import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Bug, Sparkles, X, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const APP_VERSION = "4.2.0";
const VERSION_STORAGE_KEY = "titan-last-seen-version";

interface ChangelogEntry {
  version: string;
  date: string;
  improvements: string[];
  fixes: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "4.2.0",
    date: "04/04/2026",
    improvements: [
      "Sistema de alertas de novas versões com changelog",
      "Proteção contra tela branca ao atualizar jogos no mobile/PWA",
      "Tratamento robusto de erros no portal de assinaturas",
      "Validação e saneamento de dados de sorteios",
      "Timeout inteligente em chamadas de API (8s)",
    ],
    fixes: [
      "Corrigido erro 'Component is not a function' na inicialização",
      "Corrigido tela branca ao sincronizar no celular",
      "Corrigido erro 500 no portal do cliente sem assinatura",
      "Corrigido falhas de áudio/notificação derrubando a renderização",
      "Corrigido manipulação insegura de DOM (appendChild null)",
    ],
  },
  {
    version: "4.1.0",
    date: "02/04/2026",
    improvements: [
      "Motor de IA v4.0 com análise preditiva avançada",
      "Simulador massivo com Web Workers",
      "Painel de probabilidade condicional",
      "Gerador profissional com múltiplas estratégias",
    ],
    fixes: [
      "Corrigido carregamento lento do dashboard",
      "Corrigido gráficos não renderizando no tema escuro",
    ],
  },
];

export function VersionUpdateAlert() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newEntries, setNewEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    const lastSeen = localStorage.getItem(VERSION_STORAGE_KEY);
    if (lastSeen !== APP_VERSION) {
      const entries = lastSeen
        ? CHANGELOG.filter((e) => e.version > lastSeen)
        : CHANGELOG.slice(0, 1);
      if (entries.length > 0) {
        setNewEntries(entries);
        setVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
    setVisible(false);
  };

  const handleUpdate = () => {
    localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.update());
      });
    }
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] z-[9999]"
        >
          <div className="rounded-xl border border-primary/30 bg-card shadow-2xl shadow-primary/10 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/15 to-accent/10 px-4 py-3 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Nova Versão Disponível!
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    v{newEntries[0]?.version} • {newEntries[0]?.date}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Changelog */}
            <div className="px-4 py-3 max-h-[50vh] overflow-y-auto space-y-3">
              {newEntries.slice(0, expanded ? undefined : 1).map((entry) => (
                <div key={entry.version} className="space-y-2.5">
                  {newEntries.length > 1 && (
                    <p className="text-xs font-semibold text-muted-foreground font-mono">
                      v{entry.version}
                    </p>
                  )}

                  {entry.improvements.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary">
                          Melhorias
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {entry.improvements.map((item, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground/80 pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-primary/60"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.fixes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Bug className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs font-semibold text-accent">
                          Correções
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {entry.fixes.map((item, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground/80 pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-accent/60"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {newEntries.length > 1 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Ver {newEntries.length - 1} versão(ões) anterior(es)
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-border/50 flex items-center gap-2">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="flex-1 gap-1.5"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Atualizar Agora
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
              >
                Depois
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
