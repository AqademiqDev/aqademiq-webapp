/* The Prism stem catalogue.

   Ported from the Flutter engine's `sound_manifest.dart`. The mobile app ships
   these inside its bundle; a browser cannot, so they live in the project's
   public `audio` bucket and stream per layer. Same twelve files, same layout,
   so the two clients stay in step.

   Every mode reuses the focus-mode stems with a different subset — there is
   only one set of audio.

   The files are AAC in an MP4 container, not the Ogg Vorbis the Flutter app
   bundles: Safari does not decode Ogg Vorbis, which would have left the whole
   soundscape silent there. Re-encoding also halved the payload (17 MB → 8 MB)
   — the source pads were six- and four-minute beds at ~240 kbps. */

/** The four psychoacoustic layers (architecture §4).
 *
 *  pad     — tonal anchor / key centre (F#), always-on loop
 *  texture — environmental masking (rain / sea / hum), always-on loop
 *  pulse   — rhythmic entrainment one-shots on the BPM clock
 *  spark   — stochastic spatial interest, anti-fatigue
 */
export type LayerType = 'pad' | 'texture' | 'pulse' | 'spark';

/** Factory presets. `manual` routes the full bio-driven mapper. */
export type PresetMode = 'manual' | 'focus' | 'relax' | 'break';

export interface Stem {
  /** Path within the bucket, below `stems/focus_mode/`. */
  path: string;
  type: LayerType;
  /** Weighted-pick weight for pulses; sparks pick uniformly. */
  probability: number;
  /** Note name for tonal stems, or noise colour ("pink"/"brown") for textures. */
  note?: string;
}

const stem = (path: string, type: LayerType, note?: string, probability = 1): Stem => ({
  path,
  type,
  note,
  probability,
});

/* ── The catalogue ─────────────────────────────────────────────────── */

const PAD_SLOW = stem('pads/572778__deadrobotmusic__fubfmf-slow-f-sharp-minor.m4a', 'pad', 'F#');
const PAD_CHOIR = stem(
  'pads/808032__deadrobotmusic__ambient-f-sharp-minor-ethereal-choir-pad-1.m4a',
  'pad',
  'F#',
);

const TEX_RAIN = stem('textures/mixkit-light-rain-loop-2393.m4a', 'texture', 'pink');
const TEX_HUM = stem('textures/mixkit-space-ship-hum-2136.m4a', 'texture', 'brown');
const TEX_SEA = stem('textures/mixkit-windy-sea-loop-1200.m4a', 'texture', 'pink');

const PULSE_DREAMS = stem('pulses/Cymatics - Dreams Synth Bass - E.m4a', 'pulse', 'E', 0.6);
const PULSE_808 = stem('pulses/Cymatics - Eternity 808 - E.m4a', 'pulse', 'E', 0.4);

const SPARK_KALIMBA = stem('sparks/kalimba-hit-note-high-f_F_minor.m4a', 'spark', 'F');
const SPARK_PLUCK = stem('sparks/pluck-shot-c-key.m4a', 'spark', 'C');
const SPARK_RHODES_BASSY = stem('sparks/rhodes-piano-one-shots-bassy_F.m4a', 'spark', 'F');
const SPARK_RHODES_FULL = stem('sparks/rhodes-piano-one-shots-full_F.m4a', 'spark', 'F');
const SPARK_RHODES_WARM = stem('sparks/rhodes-piano-one-shots-warm-fat_F.m4a', 'spark', 'F');

export interface SoundManifest {
  pads: Stem[];
  textures: Stem[];
  pulses: Stem[];
  sparks: Stem[];
}

/** Focus: 2 pads, 3 textures, 2 pulses, 5 sparks — the whole catalogue. */
const FOCUS: SoundManifest = {
  pads: [PAD_SLOW, PAD_CHOIR],
  textures: [TEX_RAIN, TEX_HUM, TEX_SEA],
  pulses: [PULSE_DREAMS, PULSE_808],
  sparks: [SPARK_KALIMBA, SPARK_PLUCK, SPARK_RHODES_BASSY, SPARK_RHODES_FULL, SPARK_RHODES_WARM],
};

/** Relax / wind-down: choir pad + sea, no pulses, one warm spark. */
const RELAX: SoundManifest = {
  pads: [PAD_CHOIR],
  textures: [TEX_SEA],
  pulses: [],
  sparks: [SPARK_RHODES_WARM],
};

/** Break / review: slow pad + rain, one bass pulse, no sparks. */
const BREAK: SoundManifest = {
  pads: [PAD_SLOW],
  textures: [TEX_RAIN],
  pulses: [PULSE_DREAMS],
  sparks: [],
};

export function manifestFor(mode: PresetMode): SoundManifest {
  switch (mode) {
    case 'relax':
      return RELAX;
    case 'break':
      return BREAK;
    default:
      return FOCUS;
  }
}

export const allStems = (m: SoundManifest): Stem[] => [
  ...m.pads,
  ...m.textures,
  ...m.pulses,
  ...m.sparks,
];

/* ── Where the audio lives ─────────────────────────────────────────── */

/** Overridable so a fork can host the stems elsewhere. */
const BASE =
  (import.meta.env.VITE_PRISM_STEM_BASE as string | undefined)?.replace(/\/+$/, '') ??
  `${(import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')}/storage/v1/object/public/audio/stems/focus_mode`;

/** Filenames contain spaces, so every segment is encoded individually. */
export function stemUrl(s: Stem): string {
  const encoded = s.path.split('/').map(encodeURIComponent).join('/');
  return `${BASE}/${encoded}`;
}
