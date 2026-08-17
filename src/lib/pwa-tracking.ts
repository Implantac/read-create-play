import { supabase } from "@/integrations/supabase/client";

export type PWAEventType = 'prompt_shown' | 'prompt_accepted' | 'prompt_dismissed';

export async function trackPWAEvent(eventType: PWAEventType, platform: string | null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('pwa_tracking' as any)
      .insert({
        user_id: user?.id || null,
        event_type: eventType,
        platform: platform || 'unknown'
      });

    if (error) {
      console.warn('[PWA Tracking] Error recording event:', error.message);
    } else {
      console.log(`[PWA Tracking] Event recorded: ${eventType}`);
    }
  } catch (err) {
    console.error('[PWA Tracking] Unexpected error:', err);
  }
}
