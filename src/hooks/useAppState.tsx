import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from './useAuth';
import { useProfile, useSettings, useUpdateSettings } from './data/useProfile';
import { queryClient } from '../lib/queryClient';
import type { ThemeMode } from '../lib/api';

/* ─────────────────────────────────────────────────────────────────────────
   App-level state.

   Split by ownership:
   - `theme` is **server-owned** (`settings.theme_mode`) so it follows the user
     across devices. It is mirrored to localStorage purely so the first paint
     after a reload doesn't flash the wrong palette before settings load.
   - `accent` and `warmth` have no server field — they stay local.
   - `guest`, `onboarded`, `name` and `email` are **derived** from the session
     and the profile. Nothing here invents an identity any more.
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
  /** True once onboarding has been completed on the server. */
  onboarded: boolean;
  name: string;
  email: string;
}

interface LocalPrefs {
  theme: Theme;
  accent: Accent;
  warmth: Warmth;
}

const DEFAULT_PREFS: LocalPrefs = { theme: 'light', accent: 'periwinkle', warmth: 'warm' };

const STORAGE_KEY = 'aqademiq:prefs';

function readPrefs(): LocalPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<LocalPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

const prefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/** `system` resolves against the OS setting; the UI itself is only ever binary. */
const resolveTheme = (mode: ThemeMode): Theme =>
  mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode;

interface AppContextValue extends AppState {
  set: (patch: Partial<LocalPrefs>) => void;
  toggleTheme: () => void;
  /** Signs out and drops every cached row and local preference. */
  startOver: () => void;
  /** True while the profile/settings that back this state are still loading. */
  loading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<LocalPrefs>(readPrefs);

  const { status, isGuest, email: authEmail, signOut } = useAuth();
  const authed = status === 'guest' || status === 'signed-in';

  const profile = useProfile();
  const settings = useSettings();
  const updateSettings = useUpdateSettings();

  // Adopt the server's theme once settings arrive.
  const serverTheme = settings.data?.theme_mode;
  useEffect(() => {
    if (!serverTheme) return;
    const resolved = resolveTheme(serverTheme);
    setPrefs((p) => (p.theme === resolved ? p : { ...p, theme: resolved }));
  }, [serverTheme]);

  const set = useCallback(
    (patch: Partial<LocalPrefs>) => {
      setPrefs((prev) => ({ ...prev, ...patch }));
      // Theme is the one preference the server also stores.
      if (patch.theme && authed) updateSettings.mutate({ theme_mode: patch.theme });
    },
    [authed, updateSettings],
  );

  const toggleTheme = useCallback(() => {
    setPrefs((prev) => {
      const next: Theme = prev.theme === 'dark' ? 'light' : 'dark';
      if (authed) updateSettings.mutate({ theme_mode: next });
      return { ...prev, theme: next };
    });
  }, [authed, updateSettings]);

  const startOver = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — fall through to the in-memory reset */
    }
    setPrefs(DEFAULT_PREFS);
    queryClient.clear();
    void signOut();
  }, [signOut]);

  // Persist local prefs.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* quota or privacy mode — the app still works, it just won't remember */
    }
  }, [prefs]);

  // Reflect theme / accent / warmth onto the document root so the token
  // overrides in tokens.css apply globally (including portals & scrims).
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', prefs.theme);
    root.setAttribute('data-accent', prefs.accent);
    root.setAttribute('data-warmth', prefs.warmth);
    root.style.colorScheme = prefs.theme;
  }, [prefs.theme, prefs.accent, prefs.warmth]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...prefs,
      guest: isGuest,
      onboarded: profile.data?.onboarding_complete ?? false,
      name: profile.data?.name ?? '',
      email: profile.data?.email ?? authEmail ?? '',
      loading: status === 'loading' || (authed && profile.isLoading),
      set,
      toggleTheme,
      startOver,
    }),
    [prefs, isGuest, profile.data, profile.isLoading, authEmail, status, authed, set, toggleTheme, startOver],
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
