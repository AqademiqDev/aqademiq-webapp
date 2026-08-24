/* The engine control surface — every subsystem consumes this struct.
   Ported from `models/soundscape_params.dart` (architecture §5.5). */

export const dbToLinear = (db: number): number => Math.pow(10, db / 20);

export const linearToDb = (linear: number): number =>
  20 * (Math.log(Math.min(Math.max(linear, 1e-9), 2)) / Math.LN10);

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(Math.max(v, lo), hi);

export interface SoundscapeParams {
  // Pad
  /** Pad low-pass cutoff, Hz (250–2500). */
  padCutoff: number;
  /** Pad detune, cents (0–15). */
  padDetune: number;
  /** Master reverb wet, linear 0.2–0.6. */
  padReverbWet: number;
  // Texture
  /** Texture loop level, dB (−30 … −12). */
  textureVolumeDb: number;
  /** Brown (true) vs pink (false) noise-colour selection. */
  textureBrownNoise: boolean;
  /** Haas stereo width, ms (0–15). */
  textureStereoWidthMs: number;
  // Pulse
  /** Beat clock, BPM (~50–150). */
  pulseBpm: number;
  /** Pulse envelope attack, ms (5–50). */
  pulseAttackMs: number;
  /** 1–2; above 1.5 the scheduler adds half-beat triggers. */
  pulseDensity: number;
  /** Pulse one-shot volume, linear 0–1. */
  pulseVolume: number;
  // Spark
  /** Chance a spark fires on each ~1 Hz tick. */
  sparkTriggerProb: number;
  /** Pan LFO rate, Hz (0.05–2). */
  sparkPanLfoRate: number;
  /** Octave intent, 0–2. */
  sparkOctave: number;
  /** Spark delay feedback, 0–1. */
  sparkDelayFeedback: number;
  // Global
  /** Master LPF cutoff, Hz. */
  masterLpfCutoff: number;
  /** Master gain, linear 0–1. */
  masterGain: number;
}

export const DEFAULT_PARAMS: SoundscapeParams = {
  padCutoff: 1200,
  padDetune: 0,
  padReverbWet: 0.4,
  textureVolumeDb: -18,
  textureBrownNoise: false,
  textureStereoWidthMs: 0,
  pulseBpm: 72,
  pulseAttackMs: 20,
  pulseDensity: 1,
  pulseVolume: 0.6,
  sparkTriggerProb: 0.2,
  sparkPanLfoRate: 0.2,
  sparkOctave: 1,
  sparkDelayFeedback: 0.3,
  masterLpfCutoff: 8000,
  masterGain: 0.8,
};

/** Focus (§6.1): bright open LPF, dense pulses near HR+5 BPM. */
export const focusParams = (heartRate = 72): SoundscapeParams => ({
  ...DEFAULT_PARAMS,
  masterLpfCutoff: 18000,
  pulseAttackMs: 5,
  sparkOctave: 2,
  pulseBpm: clamp(heartRate + 5, 60, 90),
  masterGain: 1,
  pulseVolume: 0.8,
  pulseDensity: 2,
  sparkTriggerProb: 0.3,
  padCutoff: 2500,
});

/** Relax / wind-down (§6.1): dark LPF, muted rhythm, wide and wet. */
export const relaxParams = (heartRate = 72): SoundscapeParams => ({
  ...DEFAULT_PARAMS,
  masterLpfCutoff: 600,
  textureStereoWidthMs: 15,
  textureBrownNoise: true,
  pulseBpm: clamp(heartRate - 10, 60, 90),
  sparkTriggerProb: 0.05,
  masterGain: 0.5,
  pulseVolume: 0,
  pulseAttackMs: 40,
  sparkOctave: 0,
  padCutoff: 600,
  padReverbWet: 0.55,
  sparkPanLfoRate: 0.1,
  sparkDelayFeedback: 0.5,
  padDetune: 12,
});

/** Break / review (§6.1): slow 60 BPM, soft pulse, very wet. */
export const breakParams = (): SoundscapeParams => ({
  ...DEFAULT_PARAMS,
  pulseAttackMs: 50,
  padDetune: 15,
  sparkDelayFeedback: 0.6,
  masterLpfCutoff: 3000,
  pulseBpm: 60,
  pulseVolume: 0.3,
  padReverbWet: 0.6,
  textureVolumeDb: -24,
});

/** Linear interpolation between two snapshots — the engine's mode morph. */
export function lerpParams(a: SoundscapeParams, b: SoundscapeParams, t: number): SoundscapeParams {
  const k = clamp(t, 0, 1);
  const n = (x: number, y: number) => x + (y - x) * k;
  return {
    padCutoff: n(a.padCutoff, b.padCutoff),
    padDetune: n(a.padDetune, b.padDetune),
    padReverbWet: n(a.padReverbWet, b.padReverbWet),
    textureVolumeDb: n(a.textureVolumeDb, b.textureVolumeDb),
    // Not a continuum — flip at the halfway point rather than averaging.
    textureBrownNoise: k < 0.5 ? a.textureBrownNoise : b.textureBrownNoise,
    textureStereoWidthMs: n(a.textureStereoWidthMs, b.textureStereoWidthMs),
    pulseBpm: n(a.pulseBpm, b.pulseBpm),
    pulseAttackMs: n(a.pulseAttackMs, b.pulseAttackMs),
    pulseDensity: n(a.pulseDensity, b.pulseDensity),
    pulseVolume: n(a.pulseVolume, b.pulseVolume),
    sparkTriggerProb: n(a.sparkTriggerProb, b.sparkTriggerProb),
    sparkPanLfoRate: n(a.sparkPanLfoRate, b.sparkPanLfoRate),
    sparkOctave: n(a.sparkOctave, b.sparkOctave),
    sparkDelayFeedback: n(a.sparkDelayFeedback, b.sparkDelayFeedback),
    masterLpfCutoff: n(a.masterLpfCutoff, b.masterLpfCutoff),
    masterGain: n(a.masterGain, b.masterGain),
  };
}

export function paramsFor(mode: Exclude<import('./manifest').PresetMode, 'manual'>): SoundscapeParams {
  switch (mode) {
    case 'relax':
      return relaxParams();
    case 'break':
      return breakParams();
    default:
      return focusParams();
  }
}
