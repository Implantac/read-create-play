
-- Fix user_missions: drop overly permissive ALL policy, allow only SELECT from clients
DROP POLICY IF EXISTS "Users can manage their own missions" ON public.user_missions;
CREATE POLICY "Users can view their own missions"
  ON public.user_missions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.user_missions FROM authenticated, anon;
GRANT ALL ON public.user_missions TO service_role;

-- Fix user_gamification: revoke write privileges from client roles (writes go via SECURITY DEFINER funcs)
REVOKE INSERT, UPDATE, DELETE ON public.user_gamification FROM authenticated, anon;
GRANT ALL ON public.user_gamification TO service_role;

-- Fix support_tickets: enforce user_id NOT NULL for data integrity
ALTER TABLE public.support_tickets ALTER COLUMN user_id SET NOT NULL;
