import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
import { env } from '../lib/env';

/* Identity.

   Auth is Supabase Auth (replatformed 2026-07-18 — the backend's own
   `/v1/auth/*` routes no longer exist). Guest mode is *anonymous sign-in*, so a
   guest already owns a real `auth.users` row and keeps every task, subject and
   streak when they upgrade — `linkGuestAccount` attaches an email identity to
   the same id rather than creating a second account.

   Email confirmation is configured to send a 6-digit code, which `VerifyEmail`
   exchanges through `verifyOtp`. */

export type AuthStatus = 'loading' | 'signed-out' | 'guest' | 'signed-in';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  status: AuthStatus;
  /** True while a Supabase call started by this context is in flight. */
  busy: boolean;
  isGuest: boolean;
  isSignedIn: boolean;
  email: string | null;

  signUp: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  verifySignUpCode: (email: string, code: string) => Promise<void>;
  resendSignUpCode: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  linkGuestAccount: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  verifyEmailChangeCode: (email: string, code: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Supabase surfaces failures as a returned `error`, never a throw. */
function raise(error: { message: string } | null): void {
  if (error) throw new Error(friendly(error.message));
}

/**
 * The password a guest chose while upgrading, held until their new email is
 * confirmed.
 *
 * Supabase refuses `updateUser({password})` on an anonymous user that has no
 * email yet ("Updating password of an anonymous user without an email or phone
 * is not allowed"), so the order has to be email → confirm → password. Keeping
 * it in a module variable means it lives only in memory for the length of the
 * upgrade — it is never written to storage, router state, or the URL.
 */
let pendingGuestPassword: string | null = null;

/** Supabase's raw strings are terse and lowercase; the UI shows these instead. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'That email and password do not match.';
  if (m.includes('email not confirmed')) return 'Confirm your email first — check your inbox for the code.';
  if (m.includes('user already registered')) return 'An account with this email already exists.';
  if (m.includes('token has expired') || m.includes('otp_expired')) return 'That code expired. Request a new one.';
  if (m.includes('invalid token') || m.includes('token is invalid')) return 'That code is not right.';
  if (m.includes('anonymous sign-ins are disabled')) return 'Guest mode is turned off for this project.';
  if (m.includes('for security purposes')) return message;
  if (m.includes('password should be at least')) return 'Use at least 8 characters for your password.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!env.configured);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!env.configured) return;
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const isGuest = Boolean(user?.is_anonymous);

  const status: AuthStatus = !ready ? 'loading' : !user ? 'signed-out' : isGuest ? 'guest' : 'signed-in';

  /** Wraps a Supabase call so every screen gets a consistent `busy` flag. */
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }, []);

  const signUp = useCallback(
    (email: string, password: string) =>
      run(async () => {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        raise(error);
        // A session here means email confirmation is disabled on the project and
        // the user is already in — skip the code screen.
        return { needsVerification: !data.session };
      }),
    [run],
  );

  const verifySignUpCode = useCallback(
    (email: string, code: string) =>
      run(async () => {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: 'signup',
        });
        raise(error);
      }),
    [run],
  );

  const resendSignUpCode = useCallback(
    (email: string) =>
      run(async () => {
        const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
        raise(error);
      }),
    [run],
  );

  const signIn = useCallback(
    (email: string, password: string) =>
      run(async () => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        raise(error);
      }),
    [run],
  );

  const signInWithGoogle = useCallback(
    () =>
      run(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/plan` },
        });
        raise(error);
      }),
    [run],
  );

  const continueAsGuest = useCallback(
    () =>
      run(async () => {
        const { error } = await supabase.auth.signInAnonymously();
        raise(error);
      }),
    [run],
  );

  const linkGuestAccount = useCallback(
    (email: string, password: string) =>
      run(async () => {
        // Email only — the password cannot be set until the address is
        // confirmed (see `pendingGuestPassword`). This sends the 6-digit code.
        const { data, error } = await supabase.auth.updateUser({ email: email.trim() });
        raise(error);
        pendingGuestPassword = password;
        return { needsVerification: !data.user?.email_confirmed_at };
      }),
    [run],
  );

  const verifyEmailChangeCode = useCallback(
    (email: string, code: string) =>
      run(async () => {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: 'email_change',
        });
        raise(error);
        // The upgraded identity only shows up after a refresh.
        await supabase.auth.refreshSession();

        // Now that the account has an email, the chosen password can be
        // applied. A failure here leaves a usable account (they can reset the
        // password by email), so it must not fail the whole upgrade.
        if (pendingGuestPassword) {
          const password = pendingGuestPassword;
          pendingGuestPassword = null;
          const { error: pwError } = await supabase.auth.updateUser({ password });
          if (pwError) {
            console.warn('[aqademiq] account upgraded but the password was not set:', pwError.message);
          }
        }
      }),
    [run],
  );

  const requestPasswordReset = useCallback(
    (email: string) =>
      run(async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        raise(error);
      }),
    [run],
  );

  const resetPassword = useCallback(
    (email: string, code: string, newPassword: string) =>
      run(async () => {
        raise(
          (await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' }))
            .error,
        );
        raise((await supabase.auth.updateUser({ password: newPassword })).error);
      }),
    [run],
  );

  const changePassword = useCallback(
    (newPassword: string) =>
      run(async () => {
        raise((await supabase.auth.updateUser({ password: newPassword })).error);
      }),
    [run],
  );

  const signOut = useCallback(
    () =>
      run(async () => {
        await supabase.auth.signOut();
        setSession(null);
      }),
    [run],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      status,
      busy,
      isGuest,
      isSignedIn: status === 'signed-in',
      email: user?.email ?? null,
      signUp,
      verifySignUpCode,
      resendSignUpCode,
      signIn,
      signInWithGoogle,
      continueAsGuest,
      linkGuestAccount,
      verifyEmailChangeCode,
      requestPasswordReset,
      resetPassword,
      changePassword,
      signOut,
    }),
    [
      session,
      user,
      status,
      busy,
      isGuest,
      signUp,
      verifySignUpCode,
      resendSignUpCode,
      signIn,
      signInWithGoogle,
      continueAsGuest,
      linkGuestAccount,
      verifyEmailChangeCode,
      requestPasswordReset,
      resetPassword,
      changePassword,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
