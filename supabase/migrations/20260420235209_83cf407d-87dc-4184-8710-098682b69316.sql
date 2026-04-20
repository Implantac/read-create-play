
-- 1. Lock down ai_analysis_cache write policies to service_role only
DROP POLICY IF EXISTS "Only service role can insert cache" ON public.ai_analysis_cache;
DROP POLICY IF EXISTS "Only service role can update cache" ON public.ai_analysis_cache;
DROP POLICY IF EXISTS "Only service role can delete cache" ON public.ai_analysis_cache;

-- service_role bypasses RLS, so no replacement write policies are needed.
-- Keep the existing authenticated SELECT policy as cache contains non-user-specific aggregate analyses.

-- 2. Create is_blocked helper
CREATE OR REPLACE FUNCTION public.is_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT blocked FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_blocked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid) TO authenticated, service_role;

-- 3. Add RESTRICTIVE policies blocking suspended users on sensitive tables
CREATE POLICY "Block suspended users from saved_bets"
ON public.saved_bets
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (NOT public.is_blocked(auth.uid()))
WITH CHECK (NOT public.is_blocked(auth.uid()));

CREATE POLICY "Block suspended users from ai_user_memory"
ON public.ai_user_memory
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (NOT public.is_blocked(auth.uid()))
WITH CHECK (NOT public.is_blocked(auth.uid()));

CREATE POLICY "Block suspended users from ai_strategy_performance"
ON public.ai_strategy_performance
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (NOT public.is_blocked(auth.uid()))
WITH CHECK (NOT public.is_blocked(auth.uid()));

-- 4. Tighten user_roles UPDATE policy to prevent admins from escalating to admin/super_admin
DROP POLICY IF EXISTS "Admins can update non-admin roles" ON public.user_roles;

CREATE POLICY "Admins can update non-admin roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND role = ANY (ARRAY['user'::app_role, 'moderator'::app_role])
    AND user_id <> auth.uid()
    -- Target user must NOT already be an admin or super_admin
    AND NOT has_role(user_id, 'admin'::app_role)
    AND NOT has_role(user_id, 'super_admin'::app_role)
  )
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND role = ANY (ARRAY['user'::app_role, 'moderator'::app_role])
    AND user_id <> auth.uid()
    AND NOT has_role(user_id, 'admin'::app_role)
    AND NOT has_role(user_id, 'super_admin'::app_role)
  )
);

-- Same hardening for INSERT and DELETE on user_roles
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND role = ANY (ARRAY['user'::app_role, 'moderator'::app_role])
    AND user_id <> auth.uid()
    AND NOT has_role(user_id, 'admin'::app_role)
    AND NOT has_role(user_id, 'super_admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND role = ANY (ARRAY['user'::app_role, 'moderator'::app_role])
    AND user_id <> auth.uid()
    AND NOT has_role(user_id, 'admin'::app_role)
    AND NOT has_role(user_id, 'super_admin'::app_role)
  )
);
