CREATE TABLE public.backtest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id text NOT NULL,
  lookback integer NOT NULL,
  draws_evaluated integer NOT NULL,
  before_metrics jsonb NOT NULL,
  after_metrics jsonb NOT NULL,
  delta jsonb NOT NULL,
  improved boolean NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.backtest_runs TO authenticated;
GRANT ALL ON public.backtest_runs TO service_role;

ALTER TABLE public.backtest_runs ENABLE ROW LEVEL SECURITY;

-- Apenas admins e super admins podem ver o histórico de backtests
CREATE POLICY "Admins can view backtest runs"
  ON public.backtest_runs FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Apenas admins e super admins podem inserir (registrar novas execuções)
CREATE POLICY "Admins can insert backtest runs"
  ON public.backtest_runs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  );

-- Apenas admins e super admins podem apagar registros antigos
CREATE POLICY "Admins can delete backtest runs"
  ON public.backtest_runs FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_backtest_runs_lottery_created
  ON public.backtest_runs (lottery_id, created_at DESC);
CREATE INDEX idx_backtest_runs_created
  ON public.backtest_runs (created_at DESC);