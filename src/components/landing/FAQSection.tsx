import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FAQSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 md:py-40 relative bg-black/20">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight md:tracking-tighter uppercase italic leading-tight">
            Perguntas <span className="gradient-brand-text">Frequentes</span>
          </h2>
        </div>
        
        <Accordion type="single" collapsible className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-white/5 bg-white/5 rounded-2xl px-6 overflow-hidden">
              <AccordionTrigger className="text-left font-bold uppercase italic tracking-tight hover:text-primary transition-colors py-6">
                {t(`landing.faq.q${i}` as any)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                {t(`landing.faq.a${i}` as any)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
