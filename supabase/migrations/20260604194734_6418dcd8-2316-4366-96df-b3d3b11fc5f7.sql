-- Expand notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system', -- 'strategy', 'result', 'social', 'account'
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
    _user_id UUID, 
    _title TEXT, 
    _message TEXT, 
    _type TEXT, 
    _action_url TEXT DEFAULT NULL,
    _priority TEXT DEFAULT 'normal',
    _category TEXT DEFAULT 'system'
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, action_url, priority, category)
    VALUES (_user_id, _title, _message, _type, _action_url, _priority, _category);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public access
REVOKE ALL ON FUNCTION public.send_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Example trigger for referral conversion
CREATE OR REPLACE FUNCTION public.on_referral_converted()
RETURNS TRIGGER AS $$
DECLARE
    referrer_name TEXT;
BEGIN
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        -- Get referrer name for personal touch
        SELECT full_name INTO referrer_name FROM public.profiles WHERE id = NEW.referrer_id;
        
        PERFORM public.send_notification(
            NEW.referrer_id,
            '🎉 Nova Indicação Ativa!',
            'Parabéns! Sua indicação foi concluída e você já está acumulando comissões.',
            'affiliate',
            '/afiliados',
            'high',
            'social'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_referral_notification
AFTER UPDATE ON public.affiliate_referrals
FOR EACH ROW EXECUTE FUNCTION public.on_referral_converted();
