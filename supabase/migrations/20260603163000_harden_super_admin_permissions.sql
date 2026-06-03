-- Harden super_admin permissions across legacy policies and user-owned tables.
-- The super_admin role must have admin precedence everywhere, including older
-- policies that only call has_role(..., 'admin').

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (_role = 'admin'::public.app_role AND role = 'super_admin'::public.app_role)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin'::public.app_role)
$$;

DO $$
BEGIN
  IF to_regclass('public.generation_history') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.generation_history TO authenticated;
    EXECUTE 'DROP POLICY IF EXISTS "Super admins can manage all generation history" ON public.generation_history';
    EXECUTE $policy$
      CREATE POLICY "Super admins can manage all generation history"
        ON public.generation_history
        AS PERMISSIVE
        FOR ALL
        TO authenticated
        USING (public.is_super_admin(auth.uid()))
        WITH CHECK (public.is_super_admin(auth.uid()))
    $policy$;
  END IF;

  IF to_regclass('public.simulation_scenarios') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_scenarios TO authenticated;
    EXECUTE 'DROP POLICY IF EXISTS "Super admins can manage all simulation scenarios" ON public.simulation_scenarios';
    EXECUTE $policy$
      CREATE POLICY "Super admins can manage all simulation scenarios"
        ON public.simulation_scenarios
        AS PERMISSIVE
        FOR ALL
        TO authenticated
        USING (public.is_super_admin(auth.uid()))
        WITH CHECK (public.is_super_admin(auth.uid()))
    $policy$;
  END IF;

  IF to_regclass('public.ai_user_memory') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_user_memory TO authenticated;
    EXECUTE 'DROP POLICY IF EXISTS "Super admins can manage all AI user memory" ON public.ai_user_memory';
    EXECUTE $policy$
      CREATE POLICY "Super admins can manage all AI user memory"
        ON public.ai_user_memory
        AS PERMISSIVE
        FOR ALL
        TO authenticated
        USING (public.is_super_admin(auth.uid()))
        WITH CHECK (public.is_super_admin(auth.uid()))
    $policy$;
  END IF;

  IF to_regclass('public.ai_strategy_performance') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_strategy_performance TO authenticated;
    EXECUTE 'DROP POLICY IF EXISTS "Super admins can manage all AI strategy performance" ON public.ai_strategy_performance';
    EXECUTE $policy$
      CREATE POLICY "Super admins can manage all AI strategy performance"
        ON public.ai_strategy_performance
        AS PERMISSIVE
        FOR ALL
        TO authenticated
        USING (public.is_super_admin(auth.uid()))
        WITH CHECK (public.is_super_admin(auth.uid()))
    $policy$;
  END IF;

  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
    EXECUTE 'DROP POLICY IF EXISTS "Super admins can manage all support tickets" ON public.support_tickets';
    EXECUTE $policy$
      CREATE POLICY "Super admins can manage all support tickets"
        ON public.support_tickets
        AS PERMISSIVE
        FOR ALL
        TO authenticated
        USING (public.is_super_admin(auth.uid()))
        WITH CHECK (public.is_super_admin(auth.uid()))
    $policy$;
  END IF;

  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Super admins can manage all avatars" ON storage.objects';
    EXECUTE $policy$
      CREATE POLICY "Super admins can manage all avatars"
        ON storage.objects
        AS PERMISSIVE
        FOR ALL
        TO authenticated
        USING (bucket_id = 'avatars' AND public.is_super_admin(auth.uid()))
        WITH CHECK (bucket_id = 'avatars' AND public.is_super_admin(auth.uid()))
    $policy$;
  END IF;
END $$;
