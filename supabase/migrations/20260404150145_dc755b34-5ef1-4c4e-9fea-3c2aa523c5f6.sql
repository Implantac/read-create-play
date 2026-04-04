
CREATE POLICY "Block non-admin role insertion"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);
