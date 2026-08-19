CREATE TABLE IF NOT EXISTS public.signup_ip_registry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash text NOT NULL,
    email text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signup_ip_registry_hash ON public.signup_ip_registry(ip_hash);

GRANT INSERT, SELECT ON public.signup_ip_registry TO authenticated;
GRANT ALL ON public.signup_ip_registry TO service_role;

ALTER TABLE public.signup_ip_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own IP registry"
ON public.signup_ip_registry
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
