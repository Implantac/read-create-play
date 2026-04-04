
-- Drop existing insert policy and recreate with proper protection
DROP POLICY IF EXISTS "Admins can insert non-admin roles" ON public.user_roles;

-- Only super_admins can assign admin/super_admin roles
-- Only admins can assign user/moderator roles (not to themselves)
-- Regular users cannot insert any roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  (is_super_admin(auth.uid()))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user'::app_role, 'moderator'::app_role) AND user_id != auth.uid())
);
