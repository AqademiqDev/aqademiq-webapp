import { useEffect, useRef } from 'react';

import { prismEngine } from '../audio/engine';
import { resolveMode } from '../audio/modes';
import { clamp } from '../audio/params';

/* Bridges the focus session to the Prism engine — the web counterpart of
   `prism_audio_provider`.

   The browser will not open an AudioContext outside a user gesture, so the
   engine is only ever started from `timer.status` turning `running`, which
   only happens because someone pressed play. Nothing here starts audio on
   mount, and a mode change while idle just re-arms the choice. */

export interface PrismAudioOptions {
  /** Catalogue key or label of the chosen mode. */
  modeKey: string | null | undefined;
  /** Focus timer state. */
  status: 'idle' | 'running' | 'paused' | 'done';
  /** User preference — sound during focus at all. */
  enabled: boolean;
  /** 0–1. */
  volume: number;
}

export function usePrismAudio({ modeKey, status, enabled, volume }: PrismAudioOptions): void {
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    const engine = prismEngine();
    const { mode, params, silent } = resolveMode(modeKey);
    const wanted = `${mode}:${modeKey ?? ''}`;

    // Silence, sound switched off, or no live session — wind down and stop.
    if (!enabled || silent || status === 'idle' || status === 'done') {
      if (startedFor.current !== null) {
        engine.stop();
        startedFor.current = null;
      }
      return;
    }

    if (status === 'paused') {
      engine.pause();
      return;
    }

    // status === 'running'
    if (startedFor.current === null) {
      startedFor.current = wanted;
      void engine
        .start(mode)
        .then(() => engine.updateParams({ ...params, masterGain: volume }))
        .catch(() => {
          // Autoplay refusal or a stem that would not load: the session is
          // unaffected, so fail quiet and let the next gesture retry.
          startedFor.current = null;
        });
      return;
    }

    if (startedFor.current !== wanted) {
      startedFor.current = wanted;
      void engine.setMode(mode).then(() => engine.updateParams({ ...params, masterGain: volume }));
      return;
    }

    if (engine.currentState === 'paused') void engine.resume();
    engine.updateParams({ ...params, masterGain: volume });
  }, [modeKey, status, enabled, volume]);

  // Leaving the screen must not leave a soundscape running behind it.
  useEffect(() => {
    return () => {
      prismEngine().stop();
    };
  }, []);
}

export const prismVolume = (percent: number | null | undefined): number =>
  clamp((percent ?? 50) / 100, 0, 1);
