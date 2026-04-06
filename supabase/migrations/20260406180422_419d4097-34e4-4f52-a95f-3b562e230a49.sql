
-- Tabela de memória da IA por usuário
CREATE TABLE public.ai_user_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id text NOT NULL,
  memory_type text NOT NULL, -- 'preference', 'pattern', 'feedback', 'learning'
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence real NOT NULL DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lottery_id, memory_type, key)
);

ALTER TABLE public.ai_user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI memory" ON public.ai_user_memory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI memory" ON public.ai_user_memory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI memory" ON public.ai_user_memory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI memory" ON public.ai_user_memory
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tabela de performance de estratégias por usuário
CREATE TABLE public.ai_strategy_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id text NOT NULL,
  strategy text NOT NULL,
  total_games integer NOT NULL DEFAULT 0,
  total_simulations integer NOT NULL DEFAULT 0,
  avg_score real NOT NULL DEFAULT 0,
  avg_hits real NOT NULL DEFAULT 0,
  best_hits integer NOT NULL DEFAULT 0,
  win_rate real NOT NULL DEFAULT 0,
  consistency real NOT NULL DEFAULT 0,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lottery_id, strategy)
);

ALTER TABLE public.ai_strategy_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategy performance" ON public.ai_strategy_performance
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategy performance" ON public.ai_strategy_performance
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategy performance" ON public.ai_strategy_performance
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategy performance" ON public.ai_strategy_performance
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
