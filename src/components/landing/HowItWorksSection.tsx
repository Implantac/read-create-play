import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    { step: "01", title: t("landing.how_it_works.step1.title"), desc: t("landing.how_it_works.step1.desc") },
    { step: "02", title: t("landing.how_it_works.step2.title"), desc: t("landing.how_it_works.step2.desc") },
    { step: "03", title: t("landing.how_it_works.step3.title"), desc: t("landing.how_it_works.step3.desc") },
    { step: "04", title: t("landing.how_it_works.step4.title"), desc: t("landing.how_it_works.step4.desc") },
    { step: "05", title: t("landing.how_it_works.step5.title"), desc: t("landing.how_it_works.step5.desc") }
  ];

  return (
    <section className="py-24 md:py-40 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
              Como a <span className="gradient-brand-text">Inteligência</span> Funciona
            </h2>
            <div className="space-y-6">
                <div key={0} className="flex gap-6 items-start group">
                  <span className="text-5xl font-black text-primary/10 group-hover:text-primary transition-colors italic leading-none">01</span>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold uppercase italic">Coleta de Históricos</h3>
                    <p className="text-muted-foreground leading-relaxed">Consolidamos todos os concursos oficiais em uma base de Big Data para análise temporal profunda.</p>
                  </div>
                </div>
                <div key={1} className="flex gap-6 items-start group">
                  <span className="text-5xl font-black text-primary/10 group-hover:text-primary transition-colors italic leading-none">02</span>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold uppercase italic">Processamento IA</h3>
                    <p className="text-muted-foreground leading-relaxed">O Titan AI Core processa milhões de combinações em busca de padrões estatísticos e anomalias.</p>
                  </div>
                </div>
                <div key={2} className="flex gap-6 items-start group">
                  <span className="text-5xl font-black text-primary/10 group-hover:text-primary transition-colors italic leading-none">03</span>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold uppercase italic">Detecção de Padrões</h3>
                    <p className="text-muted-foreground leading-relaxed">Identificamos tendências de dezenas quentes, frias e ciclos de retorno através de redes neurais.</p>
                  </div>
                </div>
                <div key={3} className="flex gap-6 items-start group">
                  <span className="text-5xl font-black text-primary/10 group-hover:text-primary transition-colors italic leading-none">04</span>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold uppercase italic">Estratégia Matemática</h3>
                    <p className="text-muted-foreground leading-relaxed">Aplicamos filtros de dispersão, equilíbrio estrutural e fechamentos para otimizar suas chances.</p>
                  </div>
                </div>
                <div key={4} className="flex gap-6 items-start group">
                  <span className="text-5xl font-black text-primary/10 group-hover:text-primary transition-colors italic leading-none">05</span>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold uppercase italic">Apostas Estratégicas</h3>
                    <p className="text-muted-foreground leading-relaxed">Geramos combinações com o Titan Score proprietário, auxiliando na tomada de decisão baseada em dados.</p>
                  </div>
                </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video glass-panel rounded-[2.5rem] border border-white/10 p-4 shadow-2xl group overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative h-full border border-white/5 rounded-[2rem] bg-black/40 backdrop-blur-md overflow-hidden flex flex-col">
              <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-6 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                </div>
                <div className="flex-1" />
              </div>
              <div className="flex-1 p-8 font-mono text-xs text-primary/40 space-y-2 overflow-hidden">
                <p>&gt; Initializing Titan Intelligence Core...</p>
                <p>&gt; Processing official historical data...</p>
                <p>&gt; Detecting statistical frequency patterns...</p>
                <p>&gt; Applying mathematical strategies...</p>
                <p>&gt; Status: High-probability games identified.</p>
                <div className="h-px w-full bg-primary/10 my-4" />
                <div className="grid grid-cols-4 gap-2">
                  {["IA", "DATA", "MATH", "PROB"].map((n, idx) => (
                    <div key={idx} className="h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] text-primary font-bold animate-pulse px-2">
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
