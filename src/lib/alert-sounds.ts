// Synthesized alert sounds using Web Audio API — no external dependencies
// Different melodies per match tier: low matches → simple beep, high matches → celebratory fanfare

import { getSoundSettings } from "@/hooks/useSoundSettings";

type Tier = "low" | "mid" | "high" | "jackpot";

function getTier(matchCount: number, pick: number): Tier {
  const ratio = matchCount / pick;
  if (ratio >= 1) return "jackpot";
  if (ratio >= 0.7) return "high";
  if (ratio >= 0.5) return "mid";
  return "low";
}

function playTone(ctx: AudioContext, freq: number, start: number, duration: number, gain = 0.25, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

const MELODIES: Record<Tier, { notes: [number, number][]; type: OscillatorType }> = {
  low: {
    notes: [[523, 0.15], [659, 0.2]],
    type: "sine",
  },
  mid: {
    notes: [[523, 0.15], [659, 0.15], [784, 0.25]],
    type: "triangle",
  },
  high: {
    notes: [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.3]],
    type: "triangle",
  },
  jackpot: {
    notes: [
      [523, 0.1], [659, 0.1], [784, 0.1],
      [1047, 0.15], [1047, 0.1], [1175, 0.1], [1319, 0.4],
    ],
    type: "square",
  },
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playMatchAlert(matchCount: number, pick: number) {
  const { muted, volume } = getSoundSettings();
  if (muted || volume === 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const volumeMultiplier = volume / 100;
  const tier = getTier(matchCount, pick);
  const melody = MELODIES[tier];
  const baseGain = (tier === "jackpot" ? 0.3 : tier === "high" ? 0.25 : 0.2) * volumeMultiplier;

  let t = ctx.currentTime + 0.05;
  for (const [freq, dur] of melody.notes) {
    playTone(ctx, freq, t, dur, baseGain, melody.type);
    t += dur * 0.85;
  }
}

export function playSimpleBeep() {
  const { muted, volume } = getSoundSettings();
  if (muted || volume === 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 880, ctx.currentTime, 0.12, 0.15 * (volume / 100), "sine");
}

/** Play a preview of a specific tier — used in settings */
export function playTierPreview(tier: Tier) {
  const { volume } = getSoundSettings();
  const ctx = getAudioContext();
  if (!ctx) return;

  const volumeMultiplier = volume / 100;
  const melody = MELODIES[tier];
  const baseGain = 0.25 * volumeMultiplier;

  let t = ctx.currentTime + 0.05;
  for (const [freq, dur] of melody.notes) {
    playTone(ctx, freq, t, dur, baseGain, melody.type);
    t += dur * 0.85;
  }
}
