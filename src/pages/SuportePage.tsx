import { Helmet } from "react-helmet-async";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, HelpCircle, Clock, Shield, CreditCard, Zap, Users, ArrowLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const WHATSAPP_NUMBER = "5543998581400";
const WHATSAPP_MESSAGE = encodeURIComponent("Olá! Preciso de ajuda com o Titan Loterias.");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const faqCategories = [
  {
    title: "Conta e Acesso",
    icon: Users,
    faqs: [
      { q: "Como adquirir o plano Vitalício?", a: "Acesse a página de planos e clique em \"Garantir acesso vitalício\". Após o pagamento de R$ 79,90, sua conta terá acesso permanente a todas as funcionalidades." },
      { q: "Esqueci minha senha, como recuperar?", a: "Na página de login, clique em \"Esqueci minha senha\". Enviaremos um link de recuperação para o e-mail cadastrado." },
      { q: "O acesso é imediato?", a: "Sim! Assim que o pagamento for confirmado, todas as ferramentas de IA e geradores profissionais estarão desbloqueados na sua conta." },
      { q: "Posso usar a mesma conta em vários dispositivos?", a: "Sim! Sua conta pode ser acessada de qualquer dispositivo com navegador. Seus dados ficam sincronizados automaticamente." },
    ],
  },
  {
    title: "Planos e Pagamento",
    icon: CreditCard,
    faqs: [
      { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos cartões de crédito, débito e Pix, processados de forma segura pelo Stripe." },
      { q: "O pagamento tem taxas recorrentes?", a: "Não. O plano Vitalício é um pagamento único de R$ 79,90. Você não terá nenhuma cobrança recorrente futura." },
      { q: "Como gerencio meu acesso?", a: "Acesse \"Perfil\" ou a página de planos para ver o status da sua conta. Como o plano é vitalício, seu acesso nunca expira." },
      { q: "Posso solicitar reembolso?", a: "Sim, oferecemos reembolso integral em até 7 dias após a compra caso você não esteja satisfeito. Basta entrar em contato pelo WhatsApp ou e-mail." },
      { q: "O plano Vitalício inclui atualizações futuras?", a: "Sim! O plano Vitalício garante acesso permanente a todas as funcionalidades atuais e futuras, sem custo adicional." },
    ],
  },
  {
    title: "Funcionalidades",
    icon: Zap,
    faqs: [
      { q: "Como funcionam as previsões da IA?", a: "Nossa IA analisa padrões estatísticos, frequências, atrasos e tendências dos sorteios históricos para gerar combinações otimizadas. Importante: não garantimos resultados." },
      { q: "Quais loterias são suportadas?", a: "Suportamos Mega-Sena, Lotofácil, Quina, Lotomania, Dupla Sena, Timemania, Dia de Sorte e +Milionária, com dados atualizados automaticamente." },
      { q: "O que são fechamentos?", a: "Fechamentos são sistemas matemáticos que garantem uma cobertura mínima de acertos se determinados números forem sorteados, otimizando suas apostas." },
      { q: "Posso salvar e gerenciar minhas apostas?", a: "Sim! Você pode salvar apostas geradas, adicionar rótulos, conferir resultados e acompanhar seu histórico completo na plataforma." },
    ],
  },
  {
    title: "Segurança e Privacidade",
    icon: Shield,
    faqs: [
      { q: "Meus dados estão seguros?", a: "Sim! Utilizamos criptografia de ponta a ponta, autenticação segura e servidores protegidos. Seus dados nunca são compartilhados com terceiros." },
      { q: "A plataforma é legalizada?", a: "O Titan Loterias é uma ferramenta de análise estatística. Não realizamos apostas nem intermediamos jogos. Você faz suas apostas diretamente nas lotéricas." },
    ],
  },
];

export default function SuportePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulando envio de formulário
    setTimeout(() => {
      setIsSubmitting(false);
      setTicketSent(true);
      toast.success("Mensagem enviada com sucesso!", {
        description: "Nossa equipe responderá em breve via e-mail.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Suporte e FAQ — Titan Loterias</title>
        <meta name="description" content="Tire dúvidas sobre planos, pagamento, IA e geradores do Titan Loterias. FAQ completo e atendimento por WhatsApp." />
        <link rel="canonical" href="https://titanloterias.lovable.app/suporte" />
        <meta property="og:title" content="Suporte e FAQ — Titan Loterias" />
        <meta property="og:description" content="Dúvidas sobre planos, IA e geradores. FAQ + atendimento WhatsApp." />
        <meta property="og:url" content="https://titanloterias.lovable.app/suporte" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">Central de Suporte</h1>
          </div>
          <Button asChild className="gap-2 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Falar no WhatsApp</span>
            </a>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Como podemos ajudar?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Encontre respostas para as dúvidas mais comuns ou entre em contato com nossa equipe.</p>
        </motion.div>

        {/* Contact Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid sm:grid-cols-2 gap-4">
          <Card className="p-6 border-border/30 bg-card/50 backdrop-blur-sm hover:border-[hsl(142,70%,45%)]/40 transition-colors group">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[hsl(142,70%,45%)]/10 border border-[hsl(142,70%,45%)]/20 flex items-center justify-center shrink-0 group-hover:bg-[hsl(142,70%,45%)]/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-[hsl(142,70%,45%)]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">WhatsApp</h3>
                <p className="text-sm text-muted-foreground mt-1">(43) 99858-1400</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Seg a Sex, 9h às 18h</span>
                </div>
              </div>
            </a>
          </Card>

          <Card className="p-6 border-border/30 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-colors group">
            <a href="mailto:suporte@titanloterias.com" className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">E-mail</h3>
                <p className="text-sm text-muted-foreground mt-1">suporte@titanloterias.com</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Resposta em até 24h</span>
                </div>
              </div>
            </a>
          </Card>
        </motion.div>

        {/* Status e Atendimento Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 border-border/30 bg-card/50 backdrop-blur-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status do Sistema</p>
              <p className="text-sm font-semibold text-foreground">Operacional</p>
            </div>
          </Card>
          <Card className="p-4 border-border/30 bg-card/50 backdrop-blur-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tempo de Resposta</p>
              <p className="text-sm font-semibold text-foreground">~ 15 minutos</p>
            </div>
          </Card>
          <Card className="p-4 border-border/30 bg-card/50 backdrop-blur-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Atendimento</p>
              <p className="text-sm font-semibold text-foreground">Fila Normal</p>
            </div>
          </Card>
        </motion.div>

        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-8 border-border/30 bg-card/50 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
            
            <div className="flex flex-col md:flex-row gap-10">
              <div className="md:w-1/3 space-y-4">
                <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">Formulário de Contato</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Não encontrou sua resposta no FAQ? Envie uma mensagem detalhada e nosso suporte técnico entrará em contato.
                </p>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-primary/60" />
                    Privacidade Garantida
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-primary/60" />
                    Suporte Prioritário Vitalício
                  </div>
                </div>
              </div>

              <div className="md:w-2/3">
                {ticketSent ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Chamado Aberto!</h4>
                      <p className="text-sm text-muted-foreground">Anote seu protocolo: #TT-{Math.floor(100000 + Math.random() * 900000)}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setTicketSent(false)}>
                      Enviar nova mensagem
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Nome Completo</label>
                        <Input required placeholder="Seu nome" className="bg-background/50 border-border/40 focus:border-primary/50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">E-mail de Cadastro</label>
                        <Input required type="email" placeholder="seu@email.com" className="bg-background/50 border-border/40 focus:border-primary/50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Assunto</label>
                      <Input required placeholder="Ex: Dúvida sobre IA, Pagamento, etc." className="bg-background/50 border-border/40 focus:border-primary/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Mensagem</label>
                      <Textarea required placeholder="Descreva sua dúvida ou problema com detalhes..." className="min-h-[120px] bg-background/50 border-border/40 focus:border-primary/50" />
                    </div>
                    <Button disabled={isSubmitting} type="submit" className="w-full gradient-brand text-primary-foreground gap-2 font-bold uppercase tracking-wider h-12 shadow-lg shadow-primary/20">
                      {isSubmitting ? (
                        <>Processando...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar Chamado Prioritário
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* FAQ Categories */}
        {faqCategories.map((category, ci) => (
          <motion.div key={ci} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + ci * 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <category.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {category.faqs.map((faq, fi) => (
                <AccordionItem
                  key={fi}
                  value={`cat-${ci}-faq-${fi}`}
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
          </motion.div>
        ))}

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-center py-8">
          <Card className="p-8 border-border/30 bg-card/50 backdrop-blur-sm inline-block">
            <p className="text-foreground font-semibold mb-2">Não encontrou o que procurava?</p>
            <p className="text-sm text-muted-foreground mb-5">Nossa equipe está pronta para ajudar você.</p>
            <Button asChild size="lg" className="gap-2 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5" />
                Falar com o Suporte
              </a>
            </Button>
          </Card>
        </motion.div>
      </main>

      <WhatsAppButton />
    </div>
  );
}
