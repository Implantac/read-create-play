REVOKE ALL ON FUNCTION public.is_full_access_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_full_access_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_full_access_role_downgrade() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_full_access_profile_delete() FROM PUBLIC, anon, authenticated;