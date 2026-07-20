
CREATE TABLE public.signup_ip_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  email text NOT NULL,
  user_id uuid,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_signup_ip_registry_ip_hash ON public.signup_ip_registry (ip_hash);
CREATE INDEX idx_signup_ip_registry_email ON public.signup_ip_registry (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signup_ip_registry TO service_role;

ALTER TABLE public.signup_ip_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role only" ON public.signup_ip_registry
  FOR ALL TO service_role USING (true) WITH CHECK (true);
