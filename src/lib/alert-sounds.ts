// Synthesized alert sounds using Web Audio API — no external dependencies
// Different melodies per match tier: low matches → simple beep, high matches → celebratory fanfare

import { getSoundSettings } from "@/hooks/useSoundSettings";
import { burstConfettiCenter } from "@/lib/confetti";

type Tier = "low" | "mid" | "high" | "jackpot";

export function getTier(matchCount: number, pick: number): Tier {
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
  // Coin-drop style — two quick metallic plinks
  low: {
    notes: [[1200, 0.08], [900, 0.15]],
    type: "triangle",
  },
  // Slot-machine partial win — ascending chime triplet
  mid: {
    notes: [[880, 0.1], [1047, 0.1], [1319, 0.22]],
    type: "triangle",
  },
  // Big win fanfare — dramatic ascending run with sustain
  high: {
    notes: [[659, 0.1], [784, 0.1], [988, 0.1], [1175, 0.12], [1319, 0.3]],
    type: "triangle",
  },
  // Jackpot celebration — slot-machine payout cascade + triumphant resolve
  jackpot: {
    notes: [
      [784, 0.08], [988, 0.08], [1175, 0.08],
      [1319, 0.1], [1568, 0.1], [1319, 0.08],
      [1568, 0.1], [1760, 0.15], [2093, 0.4],
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

  // Visual confetti for high and jackpot-tier matches
  if (tier === "jackpot") {
    burstConfettiCenter(80);
  } else if (tier === "high") {
    burstConfettiCenter(30);
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
