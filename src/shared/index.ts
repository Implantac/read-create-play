/**
 * Barrel raiz do shared kit (FASE 2 · Passo 2).
 * Reexporta hooks, serviços e integrações usados em múltiplos módulos.
 */
export { supabase } from "@/integrations/supabase/client";
export * from "@/hooks/use-toast";
export * from "@/hooks/use-mobile";
