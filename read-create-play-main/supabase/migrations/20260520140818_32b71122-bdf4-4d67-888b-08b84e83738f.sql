CREATE OR REPLACE FUNCTION public.enforce_profile_plan_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can change profile plans';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_profile_plan_changes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_profile_plan_changes() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_profile_plan_changes() FROM authenticated;