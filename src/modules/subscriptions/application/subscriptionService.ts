/**
 * Subscription application service (FASE 2 · Passo 3).
 *
 * Fachada fina sobre as edge functions de billing. As pages devem chamar este
 * serviço em vez de invocar `supabase.functions.invoke(...)` diretamente,
 * mantendo a UI livre de detalhes de infraestrutura e centralizando os guards
 * de resposta definidos em `@/core/contracts/subscription`.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  isCheckoutSessionResponse,
  isCustomerPortalResponse,
  isCheckSubscriptionResponse,
  type CheckoutSessionResponse,
  type CustomerPortalResponse,
  type CheckSubscriptionResponse,
} from "@/core/contracts/subscription";

function authHeaders(accessToken?: string): Record<string, string> | undefined {
  if (!accessToken) return undefined;
  return { Authorization: `Bearer ${accessToken}` };
}

export async function createCheckoutSession(
  planId: string,
  accessToken?: string,
): Promise<CheckoutSessionResponse | null> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { planId },
    headers: authHeaders(accessToken),
  });
  if (error) throw error;
  return isCheckoutSessionResponse(data) ? data : null;
}

export async function openCustomerPortal(
  accessToken?: string,
): Promise<CustomerPortalResponse | null> {
  const { data, error } = await supabase.functions.invoke("customer-portal", {
    headers: authHeaders(accessToken),
  });
  if (error) throw error;
  return isCustomerPortalResponse(data) ? data : null;
}

export async function syncSubscription(
  accessToken?: string,
): Promise<CheckSubscriptionResponse | null> {
  const { data, error } = await supabase.functions.invoke("check-subscription", {
    headers: authHeaders(accessToken),
  });
  if (error) throw error;
  return isCheckSubscriptionResponse(data) ? data : null;
}
