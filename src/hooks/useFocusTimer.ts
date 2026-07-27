import { useCallback, useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   useFocusTimer — the signature focus session (README §6).

   Ticks once a second while running. `progress` (0 → 1) drives both the
   depleting ring and Ada's melt; `drip` is on while running and `frost`
   while paused, matching frames 04.5 and 04.6.

   The clock is entirely client-side — the server has no tick event. The
   session row it mirrors is opened, checkpointed and completed through the
   handlers below, which fire on real transitions only (start, freeze,
   resume, tab-hide, unmount, finish) and never per second.
   ───────────────────────────────────────────────────────────────────────── */

export type FocusStatus = 'idle' | 'running' | 'paused' | 'done';

/** Server-side lifecycle hooks for the session row behind the local clock. */
export interface FocusTimerHandlers {
  /** The clock just left `idle` — open a session row. */
  onStart?: (plannedMin: number) => void;
  /** Freeze, resume, tab-hide and unmount. Never fired on a tick. */
  onCheckpoint?: (elapsedSec: number, status: 'RUNNING' | 'PAUSED') => void;
  /** Ran out or was ended early — fires exactly once per session. */
  onComplete?: (elapsedSec: number) => void;
}

export interface FocusTimer {
  status: FocusStatus;
  /** Total session length in minutes. */
  minutes: number;
  /** Seconds left in the session. */
  remaining: number;
  /** Seconds actually focused this session. */
  elapsedSec: number;
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

export function useFocusTimer(
  initialMinutes = 25,
  handlers: FocusTimerHandlers = {},
): FocusTimer {
  const [minutes, setMinutesState] = useState(initialMinutes);
  const [remaining, setRemaining] = useState(initialMinutes * 60);
  const [status, setStatus] = useState<FocusStatus>('idle');
  const tick = useRef<number | null>(null);

  const total = Math.max(1, minutes * 60);
  const elapsedSec = Math.max(0, total - remaining);

  // Live mirrors so the listeners and callbacks below never read a stale
  // closure — they are registered once but must always report *now*.
  const cb = useRef(handlers);
  cb.current = handlers;
  const elapsedRef = useRef(elapsedSec);
  elapsedRef.current = elapsedSec;
  const statusRef = useRef(status);
  statusRef.current = status;
  const minutesRef = useRef(minutes);
  minutesRef.current = minutes;
  /** Guards `onComplete` against firing twice for one session. */
  const completed = useRef(false);

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

  // Finish — from the clock running out or from the End button, once only.
  useEffect(() => {
    if (status !== 'done' || completed.current) return;
    completed.current = true;
    cb.current.onComplete?.(elapsedRef.current);
  }, [status]);

  /** Push the current elapsed time to the server without changing the clock. */
  const sync = useCallback(() => {
    const s = statusRef.current;
    if (s !== 'running' && s !== 'paused') return;
    cb.current.onCheckpoint?.(elapsedRef.current, s === 'running' ? 'RUNNING' : 'PAUSED');
  }, []);

  // Checkpoint when the tab goes away or the screen unmounts, so a reload
  // does not lose the minutes already focused.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', sync);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', sync);
      sync();
    };
  }, [sync]);

  const setMinutes = useCallback((m: number) => {
    completed.current = false;
    setMinutesState(m);
    setRemaining(m * 60);
    setStatus('idle');
  }, []);

  const start = useCallback(() => {
    completed.current = false;
    setStatus('running');
    cb.current.onStart?.(minutesRef.current);
  }, []);

  const freeze = useCallback(() => {
    setStatus('paused');
    cb.current.onCheckpoint?.(elapsedRef.current, 'PAUSED');
  }, []);

  const resume = useCallback(() => {
    setStatus('running');
    cb.current.onCheckpoint?.(elapsedRef.current, 'RUNNING');
  }, []);

  // `onComplete` is fired by the effect above, so ending early and running
  // out take exactly the same path.
  const end = useCallback(() => setStatus('done'), []);

  const reset = useCallback(() => {
    completed.current = false;
    setStatus('idle');
    setRemaining(minutesRef.current * 60);
  }, []);

  const progress = status === 'done' ? 1 : Math.min(1, Math.max(0, elapsedSec / total));

  return {
    status,
    minutes,
    remaining,
    elapsedSec,
    progress,
    clock: formatClock(remaining),
    // A session run to the end reads exactly "25:00" as frame 04.7 draws it;
    // ending early reports the real elapsed time rather than rounding to 0.
    focusedClock: formatClock(elapsedSec),
    focused: Math.floor(elapsedSec / 60),
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
