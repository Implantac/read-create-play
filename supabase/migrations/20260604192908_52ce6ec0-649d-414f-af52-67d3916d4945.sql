CREATE OR REPLACE FUNCTION public.increment_games_generated(_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_gamification (user_id, xp, total_games_generated, level)
    VALUES (_user_id, 10, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        xp = user_gamification.xp + 10,
        total_games_generated = user_gamification.total_games_generated + 1,
        level = FLOOR((user_gamification.xp + 10) / 1000) + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.increment_games_generated(UUID) TO authenticated, service_role;
