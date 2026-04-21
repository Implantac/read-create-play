
-- 1. Restrict ai_analysis_cache SELECT to service_role only (edge functions use service_role)
DROP POLICY IF EXISTS "Authenticated users can read AI cache" ON public.ai_analysis_cache;

CREATE POLICY "Service role can read AI cache"
ON public.ai_analysis_cache
FOR SELECT
TO service_role
USING (true);

-- 2. Add RESTRICTIVE DELETE policy on user_roles preventing deletion of admin/super_admin
-- by anyone other than super_admin (defense in depth on top of existing permissive policy).
CREATE POLICY "Block deletion of privileged roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (role <> 'admin'::app_role AND role <> 'super_admin'::app_role)
);

-- 3. Add RESTRICTIVE INSERT policy preventing creation of admin/super_admin
-- by anyone other than super_admin (closes TOCTOU window).
CREATE POLICY "Block insertion of privileged roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid())
  OR (role <> 'admin'::app_role AND role <> 'super_admin'::app_role)
);

-- 4. Add RESTRICTIVE UPDATE policy preventing escalation to admin/super_admin
CREATE POLICY "Block update to privileged roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (role <> 'admin'::app_role AND role <> 'super_admin'::app_role)
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR (role <> 'admin'::app_role AND role <> 'super_admin'::app_role)
);
