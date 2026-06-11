import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";

const leadSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  company_name: z.string().min(2, "Nome da empresa é obrigatório"),
  job_title: z.string().optional(),
  phone: z.string().min(8, "Telefone inválido"),
  consent_given: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos para continuar",
  }),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export function LeadCaptureForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      full_name: "",
      email: "",
      company_name: "",
      job_title: "",
      phone: "",
      consent_given: false,
    },
  });

  async function onSubmit(data: LeadFormValues) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert([
        {
          full_name: data.full_name,
          email: data.email,
          company_name: data.company_name,
          job_title: data.job_title,
          phone: data.phone,
          consent_given: data.consent_given,
        },
      ]);

      if (error) throw error;

      toast.success(t("landing.leads.success_message"));
      form.reset();
      navigate("/obrigado");
    } catch (error: any) {
      console.error("Error submitting lead:", error);
      toast.error(t("landing.leads.error_message"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="lead-capture" className="py-24 md:py-40 relative overflow-hidden bg-black/20">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-6">
              {t("landing.leads.title")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium opacity-70">
              {t("landing.leads.subtitle")}
            </p>
          </motion.div>

          <Card className="glass-card p-8 md:p-12 border-primary/20 rounded-[2.5rem] bg-black/40 backdrop-blur-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                          {t("landing.leads.name_label")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Seu nome"
                            {...field}
                            className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                          {t("landing.leads.email_label")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            {...field}
                            className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                          {t("landing.leads.company_label")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome da sua empresa"
                            {...field}
                            className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                          {t("landing.leads.role_label")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Diretor Criativo"
                            {...field}
                            className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                          {t("landing.leads.phone_label")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+55 (00) 00000-0000"
                            {...field}
                            className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] uppercase font-bold text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="consent_given"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-white/5 p-4 bg-white/5">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-white/20"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs font-medium text-muted-foreground cursor-pointer">
                          {t("landing.leads.consent_label")}
                        </FormLabel>
                        <FormMessage className="text-[10px] uppercase font-bold text-red-400" />
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-20 rounded-2xl text-base font-black uppercase tracking-widest gradient-brand text-primary-foreground shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all group"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      {t("landing.leads.submit_button")}
                      <Send className="w-5 h-5 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </section>
  );
}
