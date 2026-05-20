
CREATE POLICY "Users cannot change own plan"
  ON public.profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    plan = (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())
    OR public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users cannot change own blocked status"
  ON public.profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    blocked = (SELECT p.blocked FROM public.profiles p WHERE p.id = auth.uid())
    OR public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
