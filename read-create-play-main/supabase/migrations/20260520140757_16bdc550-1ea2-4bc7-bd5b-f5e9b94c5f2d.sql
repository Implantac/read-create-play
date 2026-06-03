CREATE OR REPLACE FUNCTION public.enforce_profile_plan_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can change profile plans';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_plan_changes_on_profiles ON public.profiles;

CREATE TRIGGER enforce_profile_plan_changes_on_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_plan_changes();

CREATE POLICY "Users can delete their own support tickets"
  ON public.support_tickets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);