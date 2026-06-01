-- 1) Ensure privileged user (etcsuporte889@gmail.com) has super_admin role via user_roles
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'etcsuporte889@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles SET plan = 'lifetime', blocked = false WHERE id = v_user_id;
  END IF;
END $$;

-- 2) Install BEFORE UPDATE trigger on profiles to enforce plan-change restriction at DB level
DROP TRIGGER IF EXISTS enforce_profile_plan_changes_trg ON public.profiles;
CREATE TRIGGER enforce_profile_plan_changes_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_plan_changes();

-- 3) Explicitly revoke any privileges on support_tickets from anon/public to defend in depth
REVOKE ALL ON public.support_tickets FROM anon;
REVOKE ALL ON public.support_tickets FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

-- 4) Same defensive revoke for profiles
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;