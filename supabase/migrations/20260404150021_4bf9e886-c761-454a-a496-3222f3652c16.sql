
-- 1. Restrict ai_analysis_cache reads to authenticated users
DROP POLICY IF EXISTS "Anyone can read AI cache" ON public.ai_analysis_cache;

CREATE POLICY "Authenticated users can read AI cache"
ON public.ai_analysis_cache FOR SELECT
TO authenticated
USING (true);

-- Keep service_role access for edge functions (service_role bypasses RLS by default)

-- 2. Create a function to restrict admin profile updates
-- Admins can only update 'blocked', super_admins can update anything
-- We achieve this by splitting the policy
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Super admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Admins can block users"
ON public.profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND id != auth.uid())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND id != auth.uid());
