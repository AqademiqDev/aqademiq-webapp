import { clamp, type SoundscapeParams } from './params';

/* The master bus (architecture §10): a resonant low-pass, a reverb, master
   gain fades and the spark pan LFO.

   Two deliberate departures from the Flutter engine, both forced by the
   platform rather than chosen:

   • SoLoud's Freeverb has no Web Audio equivalent. A ConvolverNode with a
     synthesised impulse response gets the same job done — and the repo's
     `assets/audio/ir/` folder is empty, so there was never a real IR to port.
     The IR is generated once, in-process, from noise with an exponential
     decay: cheap, deterministic, and no extra asset to download.

   • The pan LFO runs on the audio clock as a real oscillator feeding the
     panner, instead of a 50 ms `Timer` writing values from the UI thread.
     Same shape, no jitter, and it keeps running when the tab throttles
     timers. */

const PARAM_FADE_S = 15;

export class DspChain {
  readonly ctx: AudioContext;
  /** Everything the layers play into. */
  readonly input: GainNode;
  private readonly lpf: BiquadFilterNode;
  private readonly reverb: ConvolverNode;
  private readonly dry: GainNode;
  private readonly wet: GainNode;
  private readonly master: GainNode;
  /** Bipolar −0.7…0.7, for spark voices to modulate their pan around. */
  private readonly lfo: OscillatorNode;
  private readonly lfoDepth: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();

    this.lpf = ctx.createBiquadFilter();
    this.lpf.type = 'lowpass';
    this.lpf.frequency.value = 8000;
    this.lpf.Q.value = 2;

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = buildImpulse(ctx, 2.6, 2.4);

    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.dry.gain.value = 0.6;
    this.wet.gain.value = 0.4;

    this.master = ctx.createGain();
    this.master.gain.value = 0;

    // input → lpf → (dry ‖ reverb → wet) → master → out
    this.input.connect(this.lpf);
    this.lpf.connect(this.dry);
    this.lpf.connect(this.reverb);
    this.reverb.connect(this.wet);
    this.dry.connect(this.master);
    this.wet.connect(this.master);
    this.master.connect(ctx.destination);

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.2;
    this.lfoDepth = ctx.createGain();
    this.lfoDepth.gain.value = 0.7;
    this.lfo.connect(this.lfoDepth);
    this.lfo.start();
  }

  /** Spark voices connect their pan AudioParam here to inherit the wobble. */
  get panLfo(): GainNode {
    return this.lfoDepth;
  }

  /** 15 s glides toward the new targets, matching the Dart fade time. */
  updateParams(p: SoundscapeParams): void {
    const t = this.ctx.currentTime;
    const end = t + PARAM_FADE_S;
    this.lpf.frequency.cancelScheduledValues(t);
    this.lpf.frequency.linearRampToValueAtTime(clamp(p.masterLpfCutoff, 200, 20000), end);

    const wet = clamp(p.padReverbWet, 0, 1);
    this.wet.gain.cancelScheduledValues(t);
    this.wet.gain.linearRampToValueAtTime(wet, end);
    this.dry.gain.cancelScheduledValues(t);
    this.dry.gain.linearRampToValueAtTime(1 - wet, end);

    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(clamp(p.masterGain, 0, 1), end);

    this.lfo.frequency.setTargetAtTime(clamp(p.sparkPanLfoRate, 0.05, 2), t, 1);
  }

  /** Fade the whole bus in or out over `seconds`. */
  fadeMaster(to: number, seconds: number): void {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(clamp(to, 0, 1), t + seconds);
  }

  dispose(): void {
    try {
      this.lfo.stop();
    } catch {
      /* already stopped */
    }
    this.input.disconnect();
    this.master.disconnect();
  }
}

/** Noise with an exponential decay — a serviceable hall without an asset. */
function buildImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(seconds * rate));
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}
