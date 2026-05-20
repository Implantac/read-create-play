DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
    )
    AND admin_id = auth.uid()
  );

CREATE POLICY "Admins can update support tickets"
  ON public.support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
    )
    AND NOT (user_id IS DISTINCT FROM (
      SELECT t.user_id
      FROM public.support_tickets t
      WHERE t.id = support_tickets.id
    ))
    AND NOT (email IS DISTINCT FROM (
      SELECT t.email
      FROM public.support_tickets t
      WHERE t.id = support_tickets.id
    ))
    AND NOT (name IS DISTINCT FROM (
      SELECT t.name
      FROM public.support_tickets t
      WHERE t.id = support_tickets.id
    ))
    AND NOT (subject IS DISTINCT FROM (
      SELECT t.subject
      FROM public.support_tickets t
      WHERE t.id = support_tickets.id
    ))
    AND NOT (message IS DISTINCT FROM (
      SELECT t.message
      FROM public.support_tickets t
      WHERE t.id = support_tickets.id
    ))
    AND NOT (protocol IS DISTINCT FROM (
      SELECT t.protocol
      FROM public.support_tickets t
      WHERE t.id = support_tickets.id
    ))
    AND NOT (created_at IS DISTINCT FROM (
      SELECT t.created_at
      FROM public.support_tickets t
      WHERE t.id = support_tickets.id
    ))
  );