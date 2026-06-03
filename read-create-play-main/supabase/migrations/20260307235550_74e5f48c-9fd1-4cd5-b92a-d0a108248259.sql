
-- Tighten lottery_draws INSERT: only service role (via RLS bypass) should insert
-- Remove the permissive INSERT policy since service_role already bypasses RLS
DROP POLICY IF EXISTS "Service role can insert draws" ON public.lottery_draws;
