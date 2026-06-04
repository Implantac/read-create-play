-- Missions Table
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 100,
    requirement_type TEXT NOT NULL, -- 'generate_games', 'save_bets', 'run_simulations', 'check_results'
    requirement_count INTEGER NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Missions Table
CREATE TABLE IF NOT EXISTS public.user_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, mission_id)
);

-- Grants
GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.user_missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
GRANT ALL ON public.user_missions TO service_role;

-- RLS
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view missions" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Users can manage their own missions" ON public.user_missions FOR ALL USING (auth.uid() = user_id);

-- Seed some missions
INSERT INTO public.missions (title, description, xp_reward, requirement_type, requirement_count, icon) VALUES
('Iniciador Neural', 'Gere seus primeiros 10 jogos no Gerador Inteligente', 100, 'generate_games', 10, 'Zap'),
('Estrategista Senior', 'Salve 5 jogos com score acima de 80', 250, 'save_bets', 5, 'Target'),
('Cientista de Dados', 'Execute 20 simulações massivas', 300, 'run_simulations', 20, 'FlaskConical'),
('Vigilante Titan', 'Confira 5 resultados de concursos passados', 150, 'check_results', 5, 'Search');

-- Update progress function
CREATE OR REPLACE FUNCTION public.update_mission_progress(_user_id UUID, _type TEXT, _increment INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
    UPDATE public.user_missions um
    SET 
        current_progress = um.current_progress + _increment,
        completed_at = CASE 
            WHEN (um.current_progress + _increment) >= m.requirement_count AND um.completed_at IS NULL 
            THEN now() 
            ELSE um.completed_at 
        END
    FROM public.missions m
    WHERE um.mission_id = m.id
      AND um.user_id = _user_id
      AND m.requirement_type = _type;
      
    -- If newly completed, award XP (simple version, could be more complex with triggers)
    -- This is just an example, a separate trigger on update of completed_at would be better.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_mission_progress(UUID, TEXT, INTEGER) TO authenticated, service_role;
