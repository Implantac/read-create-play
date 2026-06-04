-- Define track_user_action
CREATE OR REPLACE FUNCTION public.track_user_action(_user_id UUID, _action TEXT)
RETURNS void AS $$
DECLARE
    xp_to_add INTEGER := 0;
BEGIN
    IF _action = 'simulation' THEN xp_to_add := 15;
    ELSIF _action = 'save_bet' THEN xp_to_add := 20;
    ELSIF _action = 'check_result' THEN xp_to_add := 5;
    ELSIF _action = 'daily_login' THEN xp_to_add := 50;
    END IF;

    INSERT INTO public.user_gamification (user_id, xp, level)
    VALUES (_user_id, xp_to_add, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        xp = user_gamification.xp + xp_to_add,
        total_simulations = CASE WHEN _action = 'simulation' THEN user_gamification.total_simulations + 1 ELSE user_gamification.total_simulations END,
        level = FLOOR((user_gamification.xp + xp_to_add) / 1000) + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public execution
REVOKE EXECUTE ON FUNCTION public.track_user_action(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_user_action(UUID, TEXT) TO authenticated, service_role;

-- Harden existing functions
ALTER FUNCTION public.increment_games_generated(_user_id UUID) SET search_path = public;
ALTER FUNCTION public.update_mission_progress(_user_id UUID, _type TEXT, _increment INTEGER) SET search_path = public;

REVOKE ALL ON FUNCTION public.increment_games_generated(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_mission_progress(UUID, TEXT, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.increment_games_generated(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_mission_progress(UUID, TEXT, INTEGER) TO authenticated, service_role;
