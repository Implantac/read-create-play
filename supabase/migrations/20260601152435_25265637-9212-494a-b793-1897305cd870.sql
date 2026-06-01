
-- Garantir super_admin e plano vitalicio para etcsuporte889@gmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'etcsuporte889@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles
       SET plan = 'lifetime', blocked = false
     WHERE id = v_user_id;
  END IF;
END $$;

-- Trigger de proteção: impede rebaixamento ou bloqueio do super admin protegido
CREATE OR REPLACE FUNCTION public.protect_super_admin_etcsuporte()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_protected_id uuid;
BEGIN
  SELECT id INTO v_protected_id FROM auth.users WHERE lower(email) = 'etcsuporte889@gmail.com' LIMIT 1;
  IF v_protected_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'UPDATE' AND NEW.id = v_protected_id THEN
      NEW.plan := 'lifetime';
      NEW.blocked := false;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.id = v_protected_id THEN
      RAISE EXCEPTION 'Cannot delete protected super admin profile';
    END IF;
  ELSIF TG_TABLE_NAME = 'user_roles' THEN
    IF TG_OP = 'DELETE' AND OLD.user_id = v_protected_id AND OLD.role = 'super_admin' THEN
      RAISE EXCEPTION 'Cannot remove super_admin role from protected user';
    ELSIF TG_OP = 'UPDATE' AND OLD.user_id = v_protected_id AND OLD.role = 'super_admin'
          AND (NEW.role <> 'super_admin' OR NEW.user_id <> v_protected_id) THEN
      RAISE EXCEPTION 'Cannot modify super_admin role of protected user';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS protect_super_admin_etcsuporte_profiles ON public.profiles;
CREATE TRIGGER protect_super_admin_etcsuporte_profiles
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_etcsuporte();

DROP TRIGGER IF EXISTS protect_super_admin_etcsuporte_roles ON public.user_roles;
CREATE TRIGGER protect_super_admin_etcsuporte_roles
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_etcsuporte();
