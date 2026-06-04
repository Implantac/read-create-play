
-- 1. user_gamification: drop overly permissive ALL policy, allow only SELECT for self
DROP POLICY IF EXISTS "Users can manage their own gamification" ON public.user_gamification;
CREATE POLICY "Users can view their own gamification"
  ON public.user_gamification FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
-- Writes happen only via SECURITY DEFINER functions / service_role (no INSERT/UPDATE/DELETE policy = blocked)

-- 2. user_achievements: ensure SELECT scoped to authenticated only (not public role)
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. avatars bucket: explicit public read policy (documents intent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read access for avatars'
  ) THEN
    CREATE POLICY "Public read access for avatars"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'avatars');
  END IF;
END $$;

-- 4. Fix mutable search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. Revoke EXECUTE on SECURITY DEFINER functions that should only run via triggers or service_role
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_full_access_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_full_access_profile_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_full_access_role_downgrade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_super_admin_etcsuporte() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_plan_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_referral_converted() FROM PUBLIC, anon, authenticated;

-- Gamification mutation functions: backend-only
REVOKE EXECUTE ON FUNCTION public.track_user_action(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_games_generated(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_mission_progress(uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
