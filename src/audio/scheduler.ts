import type { DspChain } from './dsp';
import type { StemLayerManager } from './layers';
import { clamp, type SoundscapeParams } from './params';

/* The engine's clocks (architecture §9): a BPM beat clock firing pulses (plus
   half-beats when density > 1.5), a 1 Hz spark clock, and 4-bar quantisation
   for queued parameter changes — only BPM jumps beyond ±1 apply immediately.

   The Dart version drives the beat from `Timer.periodic`. That is the one
   thing not worth porting faithfully: a JS timer drifts, and browsers throttle
   it hard in a background tab — which is exactly where a focus timer lives.
   This uses the standard Web Audio look-ahead instead: a coarse timer wakes
   up every 25 ms and schedules any beat falling inside the next 150 ms
   directly on the audio clock, so the rhythm stays sample-accurate. */

const BEATS_PER_PHRASE = 16;
const BPM_EPSILON = 1;
const LOOKAHEAD_S = 0.15;
const TICK_MS = 25;
const SPARK_INTERVAL_MS = 1000;

export class Scheduler {
  private readonly ctx: AudioContext;
  private readonly layers: StemLayerManager;
  private readonly dsp: DspChain;

  private tick: number | null = null;
  private sparkTimer: number | null = null;
  private nextBeatAt = 0;
  private beatCount = 0;

  private params: SoundscapeParams;
  private pending: SoundscapeParams | null = null;

  constructor(ctx: AudioContext, layers: StemLayerManager, dsp: DspChain, params: SoundscapeParams) {
    this.ctx = ctx;
    this.layers = layers;
    this.dsp = dsp;
    this.params = params;
  }

  get running(): boolean {
    return this.tick !== null;
  }

  get currentParams(): SoundscapeParams {
    return this.params;
  }

  start(params: SoundscapeParams): void {
    this.params = params;
    this.pending = null;
    this.beatCount = 0;
    this.nextBeatAt = this.ctx.currentTime + 0.05;
    this.stopTimers();
    this.tick = window.setInterval(() => this.drain(), TICK_MS);
    this.sparkTimer = window.setInterval(
      () => this.layers.trySpark(this.params),
      SPARK_INTERVAL_MS,
    );
  }

  private beatSeconds(): number {
    return 60 / clamp(this.params.pulseBpm, 20, 300);
  }

  /** Schedule every beat that lands inside the look-ahead window. */
  private drain(): void {
    const horizon = this.ctx.currentTime + LOOKAHEAD_S;
    while (this.nextBeatAt < horizon) {
      const beat = this.beatSeconds();
      this.layers.triggerPulse(this.params, this.nextBeatAt);
      // Above 1.5 the architecture adds an eighth-note in between.
      if (this.params.pulseDensity > 1.5) {
        this.layers.triggerPulse(this.params, this.nextBeatAt + beat / 2);
      }
      this.beatCount += 1;
      if (this.beatCount % BEATS_PER_PHRASE === 0) this.applyPending();
      this.nextBeatAt += beat;
    }
  }

  /** Queue a snapshot for the next phrase boundary. */
  queueParams(next: SoundscapeParams): void {
    this.pending = next;
    // A tempo change is felt immediately; everything else can wait for the bar.
    if (Math.abs(next.pulseBpm - this.params.pulseBpm) > BPM_EPSILON) {
      this.params = { ...this.params, pulseBpm: next.pulseBpm };
      this.nextBeatAt = Math.max(this.nextBeatAt, this.ctx.currentTime + 0.05);
    }
  }

  private applyPending(): void {
    const next = this.pending;
    if (!next) return;
    this.pending = null;
    this.params = next;
    this.layers.updateParams(next);
    this.dsp.updateParams(next);
  }

  /** Skip the phrase boundary — used by the engine's mode morph. */
  applyImmediately(next: SoundscapeParams): void {
    this.pending = null;
    this.params = next;
    this.layers.updateParams(next);
    this.dsp.updateParams(next);
  }

  private stopTimers(): void {
    if (this.tick !== null) window.clearInterval(this.tick);
    if (this.sparkTimer !== null) window.clearInterval(this.sparkTimer);
    this.tick = null;
    this.sparkTimer = null;
  }

  stop(): void {
    this.stopTimers();
    this.beatCount = 0;
    this.pending = null;
  }
}
