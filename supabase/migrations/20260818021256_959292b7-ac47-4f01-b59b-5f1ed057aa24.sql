-- Adiciona índice único para permitir UPSERT no rastreamento de ROI por sorteio
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roi_unique_per_draw 
ON public.user_roi_tracking (user_id, lottery_id, bet_date);

-- Garante permissões
GRANT ALL ON public.user_roi_tracking TO authenticated, service_role;
