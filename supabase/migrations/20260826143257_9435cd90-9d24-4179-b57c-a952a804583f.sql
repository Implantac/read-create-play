GRANT SELECT ON public.user_gamification TO authenticated;
GRANT ALL ON public.user_gamification TO service_role;
GRANT SELECT ON public.user_missions TO authenticated;
GRANT ALL ON public.user_missions TO service_role;
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;