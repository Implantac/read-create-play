import { supabase } from "@/integrations/supabase/client";

export type PWAEventType = 'prompt_shown' | 'prompt_accepted' | 'prompt_dismissed';

const sessionEvents = new Set<string>();

export async function trackPWAEvent(eventType: PWAEventType, platform: string | null) {
  // Deduplication logic: exactly once per session for the same event type
  const eventKey = `${eventType}`;
  if (sessionEvents.has(eventKey)) {
    console.log(`[PWA Tracking] Event ${eventType} already tracked this session, skipping.`);
    return;
  }
  
  sessionEvents.add(eventKey);

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
      // Optional: remove from set to allow retry on failure
      sessionEvents.delete(eventKey);
    } else {
      console.log(`[PWA Tracking] Event recorded: ${eventType}`);
    }
  } catch (err) {
    console.error('[PWA Tracking] Unexpected error:', err);
    sessionEvents.delete(eventKey);
  }
}
