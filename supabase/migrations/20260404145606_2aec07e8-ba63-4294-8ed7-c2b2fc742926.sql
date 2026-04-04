
-- Fix: tighten update policy to prevent self-escalation and restrict admin scope
DROP POLICY IF EXISTS "Admins can update non-admin roles" ON public.user_roles;

CREATE POLICY "Admins can update non-admin roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  (is_super_admin(auth.uid()))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user'::app_role, 'moderator'::app_role) AND user_id != auth.uid())
)
WITH CHECK (
  (is_super_admin(auth.uid()))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user'::app_role, 'moderator'::app_role) AND user_id != auth.uid())
);

-- Fix: tighten delete policy
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  (is_super_admin(auth.uid()))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user'::app_role, 'moderator'::app_role) AND user_id != auth.uid())
);

-- Fix: tighten insert policy to prevent admin self-escalation
DROP POLICY IF EXISTS "Admins can insert non-admin roles" ON public.user_roles;

CREATE POLICY "Admins can insert non-admin roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  (is_super_admin(auth.uid()))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user'::app_role, 'moderator'::app_role) AND user_id != auth.uid())
);
