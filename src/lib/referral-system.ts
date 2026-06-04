import { supabase } from "@/integrations/supabase/client";

/**
 * Sistema de indicação Titan
 * Rastreia cliques e conversões de afiliados
 */

export const ReferralSystem = {
  // Salva o código de indicação no localStorage para persistência entre sessões
  trackReferral: (code: string | null) => {
    if (code && code.startsWith("TITAN-")) {
      localStorage.setItem("titan_ref_code", code);
      console.log("[Referral] Code tracked:", code);
    }
  },

  // Obtém o código salvo
  getStoredCode: () => {
    return localStorage.getItem("titan_ref_code");
  },

  // Processa a conversão após o cadastro (opcional, pode ser feito via trigger no banco)
  processConversion: async (newUserId: string, referrerCode: string) => {
    try {
      const { data: affiliate } = await supabase
        .from("affiliate_program")
        .select("user_id")
        .eq("referral_code", referrerCode)
        .maybeSingle();

      if (affiliate) {
        // Registra a indicação
        await supabase.from("referrals").insert({
          referrer_id: affiliate.user_id,
          referred_id: newUserId,
          status: 'active'
        });
        
        // Limpa o código após conversão bem sucedida
        localStorage.removeItem("titan_ref_code");
      }
    } catch (e) {
      console.error("[Referral] Error processing conversion:", e);
    }
  }
};
