-- Revoke execution from public for sensitive functions
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant execution back to relevant roles for RLS and shared features
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_full_access_email(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_shared_closing(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_top_numbers(text, integer) TO authenticated, service_role;

-- System-only functions (only service_role/triggers)
GRANT EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_games_generated(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_mission_progress(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.track_user_action(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.on_referral_converted() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.protect_super_admin_etcsuporte() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_full_access_profile() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_full_access_role_downgrade() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_full_access_profile_delete() TO service_role;
