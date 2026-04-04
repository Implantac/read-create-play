
-- 1. Fix ai_analysis_cache: restrict write/delete to service_role only
DROP POLICY IF EXISTS "Service role can delete expired cache" ON public.ai_analysis_cache;
DROP POLICY IF EXISTS "Service role can insert cache" ON public.ai_analysis_cache;
DROP POLICY IF EXISTS "Service role can update cache" ON public.ai_analysis_cache;

CREATE POLICY "Only service role can insert cache"
ON public.ai_analysis_cache FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Only service role can update cache"
ON public.ai_analysis_cache FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Only service role can delete cache"
ON public.ai_analysis_cache FOR DELETE
TO service_role
USING (true);

-- 2. Fix privilege escalation: admins can only assign user/moderator roles, not admin/super_admin
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

CREATE POLICY "Admins can insert non-admin roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'super_admin'::app_role))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user'::app_role, 'moderator'::app_role))
);

CREATE POLICY "Admins can update non-admin roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  (has_role(auth.uid(), 'super_admin'::app_role))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user'::app_role, 'moderator'::app_role))
)
WITH CHECK (
  (has_role(auth.uid(), 'super_admin'::app_role))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user'::app_role, 'moderator'::app_role))
);
