import { DspChain } from './dsp';
import { StemLayerManager } from './layers';
import { manifestFor, type PresetMode } from './manifest';
import { Scheduler } from './scheduler';
import { DEFAULT_PARAMS, lerpParams, paramsFor, type SoundscapeParams } from './params';

/* The adaptive soundscape engine — the facade the app talks to.
   Ported from `adaptive_sound_engine.dart`.

   One browser rule shapes the whole surface: an AudioContext cannot start
   without a user gesture. `start()` is therefore always called from a click
   (pressing play on the focus timer) and resumes the context itself. */

export type EngineState = 'idle' | 'loading' | 'playing' | 'paused';

const MODE_MORPH_S = 5;
const MORPH_TICK_MS = 100;

export class PrismEngine {
  private ctx: AudioContext | null = null;
  private dsp: DspChain | null = null;
  private layers: StemLayerManager | null = null;
  private scheduler: Scheduler | null = null;

  private morph: number | null = null;
  private mode: PresetMode = 'focus';
  private params: SoundscapeParams = DEFAULT_PARAMS;
  private state: EngineState = 'idle';
  private listeners = new Set<(s: EngineState) => void>();

  get currentState(): EngineState {
    return this.state;
  }

  get currentMode(): PresetMode {
    return this.mode;
  }

  onStateChange(fn: (s: EngineState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private setState(s: EngineState): void {
    this.state = s;
    for (const fn of this.listeners) fn(s);
  }

  /** Must be called from a user gesture. Loads the mode's stems, then plays. */
  async start(mode: PresetMode = 'focus'): Promise<void> {
    this.mode = mode;
    this.params = mode === 'manual' ? DEFAULT_PARAMS : paramsFor(mode);

    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error('This browser has no Web Audio support.');
      this.ctx = new Ctor();
      this.dsp = new DspChain(this.ctx);
      this.layers = new StemLayerManager(this.ctx, this.dsp, manifestFor(mode));
    }
    // Autoplay policy: a context created before the gesture starts suspended.
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.setState('loading');
    // Only the pad + texture are awaited; the one-shots stream in behind them
    // so play starts in about a second rather than after the whole 16 MB.
    await this.layers!.loadEssential(this.params, manifestFor(mode));
    this.layers!.loadRest(manifestFor(mode));

    this.dsp!.updateParams(this.params);
    this.layers!.start(this.params);
    this.scheduler ??= new Scheduler(this.ctx, this.layers!, this.dsp!, this.params);
    this.scheduler.start(this.params);
    this.dsp!.fadeMaster(this.params.masterGain, 5);
    this.setState('playing');
  }

  /** Crossfades stems and morphs the params over 5 s rather than jumping. */
  async setMode(mode: PresetMode): Promise<void> {
    if (mode === this.mode) return;
    this.mode = mode;
    const target = mode === 'manual' ? DEFAULT_PARAMS : paramsFor(mode);
    if (this.state !== 'playing' || !this.layers || !this.scheduler) {
      this.params = target;
      return;
    }
    await this.layers.switchManifest(mode, target);
    this.morphTo(target);
  }

  /** Continuous 5 s glide, applied outside the phrase boundary. */
  private morphTo(target: SoundscapeParams): void {
    if (this.morph !== null) window.clearInterval(this.morph);
    const from = this.params;
    const startedAt = performance.now();
    this.morph = window.setInterval(() => {
      const t = (performance.now() - startedAt) / (MODE_MORPH_S * 1000);
      const next = lerpParams(from, target, t);
      this.params = next;
      this.scheduler?.applyImmediately(next);
      if (t >= 1) {
        window.clearInterval(this.morph!);
        this.morph = null;
      }
    }, MORPH_TICK_MS);
  }

  /** Push a new snapshot; the scheduler lands it on the next phrase. */
  updateParams(next: SoundscapeParams): void {
    this.params = next;
    this.scheduler?.queueParams(next);
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.scheduler?.stop();
    this.layers?.pause();
    this.dsp?.fadeMaster(0, 3);
    this.setState('paused');
  }

  async resume(): Promise<void> {
    if (this.state !== 'paused' || !this.ctx) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.layers?.resume(this.params);
    this.dsp?.fadeMaster(this.params.masterGain, 3);
    this.scheduler?.start(this.params);
    this.setState('playing');
  }

  /** 3 s fade, then silence. The context is kept for the next session. */
  stop(): void {
    if (this.morph !== null) {
      window.clearInterval(this.morph);
      this.morph = null;
    }
    this.scheduler?.stop();
    this.layers?.stop();
    this.dsp?.fadeMaster(0, 3);
    this.setState('idle');
  }

  /** Full teardown — closes the context. */
  async dispose(): Promise<void> {
    this.stop();
    this.layers?.dispose();
    this.dsp?.dispose();
    await this.ctx?.close();
    this.ctx = null;
    this.dsp = null;
    this.layers = null;
    this.scheduler = null;
    this.listeners.clear();
  }
}

/** One engine per tab — two would fight over the master bus. */
let singleton: PrismEngine | null = null;
export const prismEngine = (): PrismEngine => (singleton ??= new PrismEngine());
