import { useCallback, useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   useFocusTimer — the signature focus session (README §6).

   Ticks once a second while running. `progress` (0 → 1) drives both the
   depleting ring and Ada's melt; `drip` is on while running and `frost`
   while paused, matching frames 04.5 and 04.6.
   ───────────────────────────────────────────────────────────────────────── */

export type FocusStatus = 'idle' | 'running' | 'paused' | 'done';

export interface FocusTimer {
  status: FocusStatus;
  /** Total session length in minutes. */
  minutes: number;
  /** Seconds left in the session. */
  remaining: number;
  /** Elapsed fraction, 0 → 1. */
  progress: number;
  /** mm:ss of the time remaining. */
  clock: string;
  /** mm:ss actually focused this session — the done screen's big numeral. */
  focusedClock: string;
  /** Whole minutes focused this session. */
  focused: number;
  setMinutes: (m: number) => void;
  start: () => void;
  freeze: () => void;
  resume: () => void;
  end: () => void;
  reset: () => void;
}

export const formatClock = (totalSeconds: number) => {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

export function useFocusTimer(initialMinutes = 25): FocusTimer {
  const [minutes, setMinutesState] = useState(initialMinutes);
  const [remaining, setRemaining] = useState(initialMinutes * 60);
  const [status, setStatus] = useState<FocusStatus>('idle');
  const tick = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (tick.current !== null) {
      window.clearInterval(tick.current);
      tick.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  // Run the clock only while the session is active.
  useEffect(() => {
    if (status !== 'running') {
      clear();
      return;
    }
    tick.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setStatus('done');
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return clear;
  }, [status, clear]);

  const setMinutes = useCallback((m: number) => {
    setMinutesState(m);
    setRemaining(m * 60);
    setStatus('idle');
  }, []);

  const start = useCallback(() => setStatus('running'), []);
  const freeze = useCallback(() => setStatus('paused'), []);
  const resume = useCallback(() => setStatus('running'), []);
  const end = useCallback(() => setStatus('done'), []);

  const reset = useCallback(() => {
    setStatus('idle');
    setRemaining(minutes * 60);
  }, [minutes]);

  const total = Math.max(1, minutes * 60);
  const progress = status === 'done' ? 1 : Math.min(1, Math.max(0, (total - remaining) / total));
  const elapsed = total - remaining;

  return {
    status,
    minutes,
    remaining,
    progress,
    clock: formatClock(remaining),
    // A session run to the end reads exactly "25:00" as frame 04.7 draws it;
    // ending early reports the real elapsed time rather than rounding to 0.
    focusedClock: formatClock(elapsed),
    focused: Math.floor(elapsed / 60),
    setMinutes,
    start,
    freeze,
    resume,
    end,
    reset,
  };
}

/** Focus slider bounds — build brief, pre-resolved item 10. */
export const FOCUS_MIN = 5;
export const FOCUS_MAX = 120;
export const FOCUS_STEP = 5;
export const FOCUS_PRESETS = [15, 25, 45, 60];
