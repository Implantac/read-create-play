-- Recria funções de full access (caso tenham sido dropadas)
CREATE OR REPLACE FUNCTION public.is_full_access_email(_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT lower(COALESCE(_email, '')) = 'etcsuporte889@gmail.com';
$$;

CREATE OR REPLACE FUNCTION public.enforce_full_access_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' AND public.is_full_access_email(NEW.email) THEN
    NEW.plan := 'lifetime';
    NEW.blocked := false;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF public.is_full_access_email(OLD.email) THEN
      NEW.email := OLD.email;
      NEW.plan := 'lifetime';
      NEW.blocked := false;
    END IF;
    IF public.is_full_access_email(NEW.email) THEN
      NEW.plan := 'lifetime';
      NEW.blocked := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_full_access_role_downgrade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  target_user_id uuid := COALESCE(OLD.user_id, NEW.user_id);
  target_email text;
BEGIN
  SELECT email INTO target_email FROM public.profiles WHERE id = target_user_id;
  IF public.is_full_access_email(target_email) THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'A conta super admin protegida não pode perder a role super_admin';
    END IF;
    IF NEW.role IS DISTINCT FROM 'super_admin'::app_role THEN
      RAISE EXCEPTION 'A conta super admin protegida deve permanecer como super_admin';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_full_access_profile_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF public.is_full_access_email(OLD.email) THEN
    RAISE EXCEPTION 'A conta super admin protegida não pode ser excluída';
  END IF;
  RETURN OLD;
END;
$$;

-- Garante o estado atual correto do super admin
DO $$
DECLARE target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE lower(email) = 'etcsuporte889@gmail.com' LIMIT 1;
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, plan, blocked)
    VALUES (target_user_id, 'etcsuporte889@gmail.com', 'Claudinei da Silva', 'lifetime', false)
    ON CONFLICT (id) DO UPDATE SET plan = 'lifetime', blocked = false, updated_at = now();
    DELETE FROM public.user_roles WHERE user_id = target_user_id AND role <> 'super_admin';
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'super_admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Aplica triggers
DROP TRIGGER IF EXISTS enforce_full_access_profile_on_profiles ON public.profiles;
CREATE TRIGGER enforce_full_access_profile_on_profiles
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_full_access_profile();

DROP TRIGGER IF EXISTS prevent_full_access_profile_delete_trg ON public.profiles;
CREATE TRIGGER prevent_full_access_profile_delete_trg
BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_full_access_profile_delete();

DROP TRIGGER IF EXISTS prevent_full_access_role_delete_on_user_roles ON public.user_roles;
DROP TRIGGER IF EXISTS prevent_full_access_role_update_on_user_roles ON public.user_roles;
DROP TRIGGER IF EXISTS prevent_full_access_role_insert_on_user_roles ON public.user_roles;

CREATE TRIGGER prevent_full_access_role_delete_on_user_roles
BEFORE DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_full_access_role_downgrade();

CREATE TRIGGER prevent_full_access_role_update_on_user_roles
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_full_access_role_downgrade();

CREATE TRIGGER prevent_full_access_role_insert_on_user_roles
BEFORE INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_full_access_role_downgrade();