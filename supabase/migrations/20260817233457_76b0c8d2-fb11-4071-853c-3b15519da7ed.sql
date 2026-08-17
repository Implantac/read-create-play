
CREATE TABLE public.pwa_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('prompt_shown', 'prompt_accepted', 'prompt_dismissed')),
    platform TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT INSERT, SELECT ON public.pwa_tracking TO authenticated;
GRANT ALL ON public.pwa_tracking TO service_role;
GRANT INSERT ON public.pwa_tracking TO anon;

ALTER TABLE public.pwa_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert PWA tracking" ON public.pwa_tracking
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Admins can view all tracking" ON public.pwa_tracking
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
