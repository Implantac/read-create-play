ALTER TABLE public.profiles ADD COLUMN language text NOT NULL DEFAULT 'pt-BR';
ALTER TABLE public.profiles ADD COLUMN timezone text NOT NULL DEFAULT 'America/Sao_Paulo';
ALTER TABLE public.profiles ADD COLUMN currency_format text NOT NULL DEFAULT 'BRL';