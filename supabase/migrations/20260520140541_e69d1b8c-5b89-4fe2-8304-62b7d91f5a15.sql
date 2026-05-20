DROP POLICY IF EXISTS "Users cannot change own plan" ON public.profiles;

CREATE POLICY "Only super admins can change profile plans"
  ON public.profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    plan = (
      SELECT p.plan
      FROM public.profiles p
      WHERE p.id = profiles.id
    )
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can view all support tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can delete support tickets"
  ON public.support_tickets
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );