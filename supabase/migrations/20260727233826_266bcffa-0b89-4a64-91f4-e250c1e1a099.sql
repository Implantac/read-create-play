
CREATE TABLE public.user_alert_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  triggers JSONB NOT NULL DEFAULT '{"hot":true,"cold":true,"delay":true,"accumulated":true,"cycle":true}'::jsonb,
  last_concurso INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lottery_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_alert_configs TO authenticated;
GRANT ALL ON public.user_alert_configs TO service_role;

ALTER TABLE public.user_alert_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alert configs"
ON public.user_alert_configs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_alert_configs_user ON public.user_alert_configs(user_id);
CREATE INDEX idx_user_alert_configs_lottery ON public.user_alert_configs(lottery_id) WHERE enabled = true;

CREATE TRIGGER update_user_alert_configs_updated_at
BEFORE UPDATE ON public.user_alert_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
