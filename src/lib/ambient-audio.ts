// Generates a tech/ambient synth pad that plays alongside the demo video
// Uses Web Audio API oscillators + filters — no external API needed

export function createAmbientTrack(audioCtx: AudioContext): {
  start: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
} {
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);

  const nodes: OscillatorNode[] = [];
  const gains: GainNode[] = [];

  // Pad chord: Cm9 feel (C, Eb, G, Bb, D) — mysterious, techy
  const frequencies = [130.81, 155.56, 196.0, 233.08, 293.66];
  const detunes = [0, -5, 3, -2, 4];

  frequencies.forEach((freq, i) => {
    // Main oscillator
    const osc = audioCtx.createOscillator();
    osc.type = i < 2 ? "sawtooth" : "triangle";
    osc.frequency.value = freq;
    osc.detune.value = detunes[i];

    // Individual gain
    const gain = audioCtx.createGain();
    gain.gain.value = 0.06 - i * 0.008;

    // Low-pass filter for warmth
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800 + i * 100;
    filter.Q.value = 0.7;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    nodes.push(osc);
    gains.push(gain);
  });

  // Sub bass pulse
  const subOsc = audioCtx.createOscillator();
  subOsc.type = "sine";
  subOsc.frequency.value = 65.41; // C2
  const subGain = audioCtx.createGain();
  subGain.gain.value = 0.08;
  subOsc.connect(subGain);
  subGain.connect(masterGain);
  nodes.push(subOsc);
  gains.push(subGain);

  // Shimmer - high frequency subtle texture
  const shimmer = audioCtx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.value = 1318.5; // E6
  const shimmerGain = audioCtx.createGain();
  shimmerGain.gain.value = 0.01;
  const shimmerFilter = audioCtx.createBiquadFilter();
  shimmerFilter.type = "bandpass";
  shimmerFilter.frequency.value = 1300;
  shimmerFilter.Q.value = 5;
  shimmer.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(masterGain);
  nodes.push(shimmer);
  gains.push(shimmerGain);

  // LFO for subtle movement
  const lfo = audioCtx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15; // Very slow
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 50;
  lfo.connect(lfoGain);
  // Modulate the main filter frequencies slightly
  nodes.push(lfo);

  let started = false;

  return {
    start() {
      if (started) return;
      started = true;
      nodes.forEach((n) => n.start());
      // Fade in
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.5);
    },
    stop() {
      // Fade out
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
      setTimeout(() => {
        nodes.forEach((n) => {
          try { n.stop(); } catch { /* already stopped */ }
        });
        started = false;
      }, 1000);
    },
    setVolume(v: number) {
      masterGain.gain.linearRampToValueAtTime(v, audioCtx.currentTime + 0.1);
    },
  };
}
