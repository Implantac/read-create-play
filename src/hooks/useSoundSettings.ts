import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "titan-sound-settings";

export interface SoundSettings {
  muted: boolean;
  volume: number; // 0–100
}

const DEFAULTS: SoundSettings = { muted: false, volume: 70 };

function load(): SoundSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function save(s: SoundSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// Global getter for non-React code (alert-sounds.ts)
export function getSoundSettings(): SoundSettings {
  return load();
}

export function useSoundSettings() {
  const [settings, setSettings] = useState<SoundSettings>(load);

  useEffect(() => {
    save(settings);
  }, [settings]);

  const setVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume: Math.max(0, Math.min(100, volume)) }));
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setSettings(prev => ({ ...prev, muted }));
  }, []);

  const toggleMute = useCallback(() => {
    setSettings(prev => ({ ...prev, muted: !prev.muted }));
  }, []);

  return { ...settings, setVolume, setMuted, toggleMute };
}
