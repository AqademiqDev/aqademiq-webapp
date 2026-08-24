import type { DspChain } from './dsp';
import { allStems, manifestFor, stemUrl, type SoundManifest, type Stem } from './manifest';
import { clamp, dbToLinear, type SoundscapeParams } from './params';

/* Owns every voice: the always-on pad/texture loops and the pulse/spark
   one-shots. Ported from `stem_layer_manager.dart` (architecture §8).

   Decoded buffers are cached by path and shared across manifests, because
   every mode reuses the same twelve files — switching mode re-picks stems, it
   does not re-download them. */

const DEFAULT_FADE = 10;
const QUICK_FADE = 3;
const START_FADE = 5;
const SPARK_MIN_GAP_MS = 3000;
const PAD_VOLUME = 0.6;
const SPARK_VOLUME = 0.4;
const SPARK_PAN_DEPTH = 0.7;
/** Cap on simultaneously ringing sparks (§14). */
const MAX_SPARKS = 8;

interface Loop {
  source: AudioBufferSourceNode;
  gain: GainNode;
  stem: Stem;
}

export class StemLayerManager {
  private readonly ctx: AudioContext;
  private readonly dsp: DspChain;
  private readonly buffers = new Map<string, AudioBuffer>();
  /** De-duplicates concurrent fetches of the same stem. */
  private readonly loading = new Map<string, Promise<void>>();
  /** The pad/texture chosen by `loadEssential`, so `start` reuses them. */
  private primed: { pad?: Stem; texture?: Stem } = {};
  /** In-flight pad fetch, so `start` can bring it in late. */
  private padPending: Promise<void> | null = null;
  private manifest: SoundManifest;

  private pad: Loop | null = null;
  private texture: Loop | null = null;
  private sparks: AudioBufferSourceNode[] = [];
  private lastSparkAt = 0;
  /** Bumped on every stop, so a late pad cannot start after the session ends. */
  private generation = 0;

  constructor(ctx: AudioContext, dsp: DspChain, manifest: SoundManifest) {
    this.ctx = ctx;
    this.dsp = dsp;
    this.manifest = manifest;
  }

  private load(s: Stem): Promise<void> {
    if (this.buffers.has(s.path)) return Promise.resolve();
    const inFlight = this.loading.get(s.path);
    if (inFlight) return inFlight;
    const job = (async () => {
      const res = await fetch(stemUrl(s));
      if (!res.ok) throw new Error(`Could not load ${s.path} (${res.status})`);
      this.buffers.set(s.path, await this.ctx.decodeAudioData(await res.arrayBuffer()));
    })().finally(() => this.loading.delete(s.path));
    this.loading.set(s.path, job);
    return job;
  }

  /**
   * Load only what is needed to make the *first* sound: the texture.
   *
   * The pads dominate the payload — even re-encoded, the slow F# pad is 4.4 MB
   * against a 180–360 KB texture — so waiting on one meant ten seconds of
   * silence after pressing play. The texture alone is a complete ambience, so
   * it starts immediately and the pad fades in underneath it when it arrives.
   * One-shots are tiny and not needed until the first beat.
   */
  async loadEssential(params: SoundscapeParams, manifest = this.manifest): Promise<void> {
    const pad = pick(manifest.pads);
    const texture = this.pickTextureFrom(manifest, params);
    this.primed = { pad, texture };
    // Kick the pad off now but do not block on it.
    this.padPending = pad ? this.load(pad).catch(() => undefined) : null;
    if (texture) await this.load(texture);
  }

  /** Everything else, in the background. Failures here are not fatal. */
  loadRest(manifest = this.manifest): void {
    for (const s of allStems(manifest)) void this.load(s).catch(() => undefined);
  }

  /** Fetch + decode everything this manifest needs that isn't cached. */
  async loadStems(manifest = this.manifest): Promise<void> {
    await Promise.all(allStems(manifest).map((s) => this.load(s)));
  }

  /** True once every stem of the current manifest is decoded. */
  get ready(): boolean {
    return allStems(this.manifest).every((s) => this.buffers.has(s.path));
  }

  /** Starts the always-on layers, fading in over 5 s. */
  start(params: SoundscapeParams): void {
    this.startTexture(params, START_FADE);
    const padStem = this.primed.pad;
    if (padStem && !this.buffers.has(padStem.path) && this.padPending) {
      // Still downloading — join it when it lands, unless the session ended
      // in the meantime.
      const generation = ++this.generation;
      void this.padPending.then(() => {
        if (this.generation === generation && !this.pad) this.startPad(START_FADE);
      });
      return;
    }
    this.startPad(START_FADE);
  }

  private startPad(fade: number): void {
    const stem = this.primed.pad ?? pick(this.manifest.pads);
    if (!stem) return;
    this.pad = this.startLoop(stem, PAD_VOLUME, fade);
  }

  private startTexture(params: SoundscapeParams, fade: number): void {
    const stem = this.primed.texture ?? this.pickTexture(params);
    if (!stem) return;
    this.texture = this.startLoop(stem, this.textureTarget(params), fade);
  }

  /** Noise colour comes from the stem's `note`, never from its filename. */
  private pickTexture(params: SoundscapeParams): Stem | undefined {
    return this.pickTextureFrom(this.manifest, params);
  }

  private pickTextureFrom(manifest: SoundManifest, params: SoundscapeParams): Stem | undefined {
    const want = params.textureBrownNoise ? 'brown' : 'pink';
    return manifest.textures.find((s) => s.note === want) ?? manifest.textures[0];
  }

  private textureTarget = (p: SoundscapeParams) => clamp(dbToLinear(p.textureVolumeDb), 0, 1);

  private startLoop(stem: Stem, target: number, fade: number): Loop | null {
    const buffer = this.buffers.get(stem.path);
    if (!buffer) return null;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(target, t + fade);
    source.connect(gain).connect(this.dsp.input);
    source.start();
    return { source, gain, stem };
  }

  /** Long-fade the loop levels toward the (possibly new) params. */
  updateParams(params: SoundscapeParams): void {
    const t = this.ctx.currentTime;
    if (this.pad) {
      this.pad.gain.gain.cancelScheduledValues(t);
      this.pad.gain.gain.linearRampToValueAtTime(PAD_VOLUME, t + DEFAULT_FADE);
    }
    if (this.texture) {
      this.texture.gain.gain.cancelScheduledValues(t);
      this.texture.gain.gain.linearRampToValueAtTime(this.textureTarget(params), t + DEFAULT_FADE);
    }
  }

  /** One pulse one-shot, weighted-random by `probability`. */
  triggerPulse(params: SoundscapeParams, when = this.ctx.currentTime): void {
    if (params.pulseVolume <= 0) return;
    const stem = weightedPick(this.manifest.pulses);
    const buffer = stem && this.buffers.get(stem.path);
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    // The attack is a real envelope here; the Dart engine only stored intent.
    const attack = clamp(params.pulseAttackMs, 1, 200) / 1000;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(clamp(params.pulseVolume, 0, 1), when + attack);
    source.connect(gain).connect(this.dsp.input);
    source.start(when);
    source.onended = () => gain.disconnect();
  }

  /** Maybe fire a spark: probability-gated, min 3 s apart, random pan ±0.7. */
  trySpark(params: SoundscapeParams): void {
    const now = performance.now();
    if (now - this.lastSparkAt < SPARK_MIN_GAP_MS) return;
    if (Math.random() > clamp(params.sparkTriggerProb, 0, 1)) return;
    this.cleanupSparks();
    if (this.sparks.length >= MAX_SPARKS) return;

    const stem = pick(this.manifest.sparks);
    const buffer = stem && this.buffers.get(stem.path);
    if (!buffer) return;
    this.lastSparkAt = now;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const panner = this.ctx.createStereoPanner();
    // Its own random placement, with the LFO modulating *around* it — the
    // value is never accumulated, so the position cannot drift.
    panner.pan.value = (Math.random() * 2 - 1) * SPARK_PAN_DEPTH;
    this.dsp.panLfo.connect(panner.pan);

    const gain = this.ctx.createGain();
    gain.gain.value = SPARK_VOLUME;
    source.connect(panner).connect(gain).connect(this.dsp.input);
    source.start();
    this.sparks.push(source);
    source.onended = () => {
      try {
        this.dsp.panLfo.disconnect(panner.pan);
      } catch {
        /* already torn down */
      }
      gain.disconnect();
      this.sparks = this.sparks.filter((s) => s !== source);
    };
  }

  private cleanupSparks(): void {
    this.sparks = this.sparks.filter(Boolean);
  }

  /** Crossfade to another mode's stems over 10 s (§8.6). */
  async switchManifest(mode: Parameters<typeof manifestFor>[0], params: SoundscapeParams): Promise<void> {
    const next = manifestFor(mode);
    await this.loadEssential(params, next);
    this.loadRest(next);
    const oldPad = this.pad;
    const oldTexture = this.texture;
    this.manifest = next;
    this.pad = null;
    this.texture = null;
    this.startPad(DEFAULT_FADE);
    this.startTexture(params, DEFAULT_FADE);
    this.fadeOutAndStop([oldPad, oldTexture], DEFAULT_FADE);
  }

  /** 3 s fade to silence, holding the voices so they can resume. */
  pause(): void {
    const t = this.ctx.currentTime;
    for (const loop of [this.pad, this.texture]) {
      if (!loop) continue;
      loop.gain.gain.cancelScheduledValues(t);
      loop.gain.gain.setValueAtTime(loop.gain.gain.value, t);
      loop.gain.gain.linearRampToValueAtTime(0, t + QUICK_FADE);
    }
  }

  /** Fade the loops back to their targets over 3 s. */
  resume(params: SoundscapeParams): void {
    const t = this.ctx.currentTime;
    if (this.pad) this.pad.gain.gain.linearRampToValueAtTime(PAD_VOLUME, t + QUICK_FADE);
    if (this.texture) {
      this.texture.gain.gain.linearRampToValueAtTime(this.textureTarget(params), t + QUICK_FADE);
    }
  }

  /** 3 s fade, then stop everything. */
  stop(): void {
    this.generation += 1;
    const loops = [this.pad, this.texture];
    this.pad = null;
    this.texture = null;
    this.fadeOutAndStop(loops, QUICK_FADE);
    for (const s of this.sparks) {
      try {
        s.stop();
      } catch {
        /* already ended */
      }
    }
    this.sparks = [];
  }

  private fadeOutAndStop(loops: (Loop | null)[], fade: number): void {
    const t = this.ctx.currentTime;
    for (const loop of loops) {
      if (!loop) continue;
      loop.gain.gain.cancelScheduledValues(t);
      loop.gain.gain.setValueAtTime(loop.gain.gain.value, t);
      loop.gain.gain.linearRampToValueAtTime(0, t + fade);
      try {
        loop.source.stop(t + fade + 0.2);
      } catch {
        /* already stopped */
      }
    }
  }

  dispose(): void {
    this.stop();
    this.buffers.clear();
  }
}

const pick = <T,>(list: T[]): T | undefined =>
  list.length ? list[Math.floor(Math.random() * list.length)] : undefined;

/** Weighted by `probability`; falls back to uniform if the weights are zero. */
function weightedPick(list: Stem[]): Stem | undefined {
  if (!list.length) return undefined;
  const total = list.reduce((n, s) => n + Math.max(0, s.probability), 0);
  if (total <= 0) return pick(list);
  let r = Math.random() * total;
  for (const s of list) {
    r -= Math.max(0, s.probability);
    if (r <= 0) return s;
  }
  return list[list.length - 1];
}
