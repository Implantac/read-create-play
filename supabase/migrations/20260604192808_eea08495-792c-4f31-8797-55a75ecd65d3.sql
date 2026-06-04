-- 1. Gamification
CREATE TABLE public.user_gamification (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_games_generated INTEGER DEFAULT 0,
  total_games_won INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'mestre', 'especialista', etc.
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Investment Simulator
CREATE TABLE public.investment_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id TEXT NOT NULL,
  monthly_budget NUMERIC(12, 2) NOT NULL,
  duration_months INTEGER NOT NULL,
  risk_level TEXT NOT NULL, -- 'low', 'medium', 'high'
  recommended_strategy_id TEXT,
  estimated_return NUMERIC(12, 2),
  simulation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Central de Insights
CREATE TABLE public.system_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id TEXT NOT NULL,
  insight_type TEXT NOT NULL, -- 'trend', 'opportunity', 'alert'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  score INTEGER DEFAULT 0, -- Importance score
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Sistema de Favoritos (Unified)
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'game', 'strategy', 'simulation', 'insight'
  item_id TEXT NOT NULL, -- External ID or UUID
  title TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. ROI Tracking
CREATE TABLE public.user_roi_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id TEXT NOT NULL,
  bet_date DATE NOT NULL,
  amount_spent NUMERIC(12, 2) NOT NULL,
  amount_won NUMERIC(12, 2) DEFAULT 0,
  game_ids UUID[], -- Reference to generation_history or saved_bets
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Affiliate Program
CREATE TABLE public.affiliate_program (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  total_earned NUMERIC(12, 2) DEFAULT 0,
  balance_available NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who earns it
  from_user_id UUID REFERENCES auth.users(id), -- Referral source
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'strategy', 'result', 'achievement', 'affiliate'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. RLS and Grants
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Polices
CREATE POLICY "Users can manage their own gamification" ON public.user_gamification FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their simulations" ON public.investment_simulations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view insights" ON public.system_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their favorites" ON public.user_favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their ROI" ON public.user_roi_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their affiliate status" ON public.affiliate_program FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their referrals" ON public.affiliate_referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can view their commissions" ON public.affiliate_commissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON public.user_gamification TO authenticated, service_role;
GRANT ALL ON public.user_achievements TO authenticated, service_role;
GRANT ALL ON public.investment_simulations TO authenticated, service_role;
GRANT ALL ON public.system_insights TO authenticated, service_role;
GRANT ALL ON public.user_favorites TO authenticated, service_role;
GRANT ALL ON public.user_roi_tracking TO authenticated, service_role;
GRANT ALL ON public.affiliate_program TO authenticated, service_role;
GRANT ALL ON public.affiliate_referrals TO authenticated, service_role;
GRANT ALL ON public.affiliate_commissions TO authenticated, service_role;
GRANT ALL ON public.notifications TO authenticated, service_role;

-- Trigger for updated_at on user_gamification
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON public.user_gamification FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
