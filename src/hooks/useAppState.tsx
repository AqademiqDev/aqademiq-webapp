import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   App-level state: theme, brand accent, background warmth, guest mode.
   Persisted to localStorage per the build brief's pre-resolved decision 12.
   ───────────────────────────────────────────────────────────────────────── */

export type Theme = 'light' | 'dark';
export type Accent = 'periwinkle' | 'rose' | 'green';
export type Warmth = 'warm' | 'neutral' | 'cool';

export interface AppState {
  theme: Theme;
  accent: Accent;
  warmth: Warmth;
  /** True while exploring without an account — locks Ada & Profile. */
  guest: boolean;
  /** True once onboarding has been completed (or the user signed in). */
  onboarded: boolean;
  name: string;
  email: string;
}

const DEFAULTS: AppState = {
  theme: 'light',
  accent: 'periwinkle',
  warmth: 'warm',
  guest: false,
  onboarded: false,
  name: 'Ridhwan Ahamed',
  email: 'ridhwan@bits.ac.in',
};

const STORAGE_KEY = 'aqademiq:app';

function read(): AppState {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppState>) };
  } catch {
    return DEFAULTS;
  }
}

interface AppContextValue extends AppState {
  set: (patch: Partial<AppState>) => void;
  toggleTheme: () => void;
  /** Clears all persisted guest data — the explicit "start over". */
  startOver: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(read);

  const set = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const startOver = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem('aqademiq:guestData');
    } catch {
      /* storage unavailable — fall through to in-memory reset */
    }
    setState(DEFAULTS);
  }, []);

  // Persist.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or privacy mode — the app still works, it just won't remember */
    }
  }, [state]);

  // Reflect theme / accent / warmth onto the document root so the token
  // overrides in tokens.css apply globally (including portals & scrims).
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', state.theme);
    root.setAttribute('data-accent', state.accent);
    root.setAttribute('data-warmth', state.warmth);
    root.style.colorScheme = state.theme;
  }, [state.theme, state.accent, state.warmth]);

  const value = useMemo<AppContextValue>(
    () => ({ ...state, set, toggleTheme, startOver }),
    [state, set, toggleTheme, startOver],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}

/** Convenience alias used by the Appearance panel and the nav toggle. */
export const useTheme = useAppState;
