CREATE POLICY "Service role can delete expired cache" ON public.ai_analysis_cache FOR DELETE USING (true);
CREATE POLICY "Service role can insert cache" ON public.ai_analysis_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update cache" ON public.ai_analysis_cache FOR UPDATE USING (true) WITH CHECK (true);