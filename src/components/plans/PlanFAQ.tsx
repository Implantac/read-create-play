import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";

const faqs = [
  { q: "Como funciona o período de teste?", a: "Você pode usar o plano Gratuito sem limite de tempo. Ao assinar um plano pago, você terá acesso imediato a todas as funcionalidades do plano escolhido." },
  { q: "Posso trocar de plano a qualquer momento?", a: "Sim! Você pode fazer upgrade ou downgrade do seu plano quando quiser. Ao fazer upgrade, a diferença será cobrada proporcionalmente. Ao fazer downgrade, o novo valor será aplicado no próximo ciclo de cobrança." },
  { q: "Como cancelo minha assinatura?", a: "Você pode cancelar a qualquer momento clicando em \"Gerenciar assinatura\" nesta página. O cancelamento é imediato, mas você mantém o acesso até o final do período já pago." },
  { q: "O plano Vitalício inclui atualizações futuras?", a: "Sim! O plano Vitalício garante acesso permanente a todas as funcionalidades atuais e futuras da plataforma, sem nenhum custo adicional." },
  { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos cartões de crédito e débito (Visa, Mastercard, Elo, American Express) e Pix, tudo processado de forma segura pelo Stripe." },
  { q: "Posso solicitar reembolso?", a: "Sim, oferecemos reembolso integral em até 7 dias após a compra, sem perguntas. Basta entrar em contato com nosso suporte." },
];

export function PlanFAQ() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="mt-16 max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Perguntas Frequentes</h2>
          <p className="text-xs text-muted-foreground">Tire suas dúvidas antes de assinar</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border border-border/30 rounded-lg px-4 bg-card/50 backdrop-blur-sm data-[state=open]:border-primary/30 transition-colors"
          >
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/50 border border-border/30">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Ainda tem dúvidas?{" "}
            <a href="mailto:suporte@titanloterias.com" className="text-primary hover:underline font-medium">
              Fale com nosso suporte
            </a>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
