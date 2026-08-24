import type { PresetMode } from './manifest';
import { breakParams, focusParams, relaxParams, type SoundscapeParams } from './params';

/* UI mode → engine preset.

   Ported from `prism_audio_provider.mapMode`. The catalogue names are what the
   API serves; the engine only has three soundscapes, so several names share
   one preset with a variant applied on top:

   * Deep Work — Focus as specced: bright, dense low-frequency pulses.
   * Flow      — Focus stems with a calmer surface: quarter-notes only,
                 softer rhythm, half-closed LPF, sparser sparks.
   * Review    — Break: steady 60 BPM midtempo over the rain texture.
   * Wind-down — Relax: choir pad + sea, no rhythm.
   * No sound  — silence; the engine never starts.

   The served catalogue also carries plain ambiences (Café, Forest, Rain, White
   noise). Mobile funnels anything unrecognised into Focus, and this matches —
   the generative engine has no literal café or forest, and picking one should
   still give the user sound rather than nothing. */

export interface ResolvedMode {
  mode: PresetMode;
  params: SoundscapeParams;
  /** True for "No sound" — the caller should not start the engine. */
  silent: boolean;
}

/** Flow: the Focus soundscape with its edges taken off. */
const flow = (p: SoundscapeParams): SoundscapeParams => ({
  ...p,
  pulseDensity: 1,
  pulseVolume: p.pulseVolume * 0.6,
  masterLpfCutoff: 8000,
  sparkTriggerProb: 0.15,
});

/** Accepts either the catalogue key (`deep`, `wind`) or its label. */
export function resolveMode(keyOrLabel: string | null | undefined): ResolvedMode {
  const k = (keyOrLabel ?? '').trim().toLowerCase();

  if (k === 'none' || k === 'no sound') {
    return { mode: 'focus', params: focusParams(), silent: true };
  }
  if (k === 'flow') {
    return { mode: 'focus', params: flow(focusParams()), silent: false };
  }
  if (k === 'review') {
    return { mode: 'break', params: breakParams(), silent: false };
  }
  if (k === 'wind' || k === 'wind-down' || k === 'winddown') {
    return { mode: 'relax', params: relaxParams(), silent: false };
  }
  // Deep Work and every unrecognised ambience.
  return { mode: 'focus', params: focusParams(), silent: false };
}
