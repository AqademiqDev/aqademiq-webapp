import { useCallback, useSyncExternalStore } from 'react';

/* Whether the weekly report is shown at all.

   The design starts with a real off switch, and everything else depends on it:
   a report you cannot decline is a report that can hurt you every seven days
   forever. One click, honoured immediately — no confirmation, no win-back, no
   re-prompt later. Turning it off removes the entry point from Profile; there
   is no other way in.

   Stored locally rather than on the server, as the mobile app does. It takes
   effect with no round trip, and it works identically for a guest — a server
   preference would need an account, which would make declining the report
   something you have to sign up to do. */

const KEY = 'aqademiq:weekly-report-enabled';

const listeners = new Set<() => void>();

/** Held when storage refuses a write, so the choice still applies for this session. */
let unsaved: boolean | null = null;

/** Defaults to on: an unset value is a student who has not been asked yet. */
function read(): boolean {
  if (unsaved !== null) return unsaved;
  try {
    return window.localStorage.getItem(KEY) !== 'false';
  } catch {
    return true;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab turning it off should take effect here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useWeeklyReportEnabled(): [boolean, (value: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, read, () => true);

  const set = useCallback((value: boolean) => {
    try {
      window.localStorage.setItem(KEY, String(value));
      unsaved = null;
    } catch {
      // Storage unavailable (quota, privacy mode): honour the choice in memory.
      unsaved = value;
    }
    // Notify in the same tick, so the entry card disappears with the click
    // rather than after a reload.
    listeners.forEach((l) => l());
  }, []);

  return [enabled, set];
}
