import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import AppShell from './layouts/AppShell';
import AuthShell from './layouts/AuthShell';

import Splash from './screens/entry/Splash';
import Welcome from './screens/entry/Welcome';
import SignIn from './screens/entry/SignIn';
import SignUp from './screens/entry/SignUp';
import VerifyEmail from './screens/entry/VerifyEmail';
import AuthCallback from './screens/entry/AuthCallback';
import Onboarding from './screens/onboarding/Onboarding';

import Dashboard from './screens/plan/Dashboard';
import Microtasks from './screens/plan/Microtasks';
import Subjects from './screens/subjects/Subjects';
import Focus from './screens/focus/Focus';
import Ada from './screens/ada/Ada';
import Profile from './screens/profile/Profile';
import Feedback from './screens/feedback/Feedback';
import SuggestionDetail from './screens/feedback/SuggestionDetail';
import Settings from './screens/settings/Settings';

import Appearance from './screens/settings/panels/Appearance';
import StudyTags from './screens/settings/panels/StudyTags';
import Notifications from './screens/settings/panels/Notifications';
import Prism from './screens/settings/panels/Prism';
import ImportPanel from './screens/settings/panels/Import';
import Memories from './screens/settings/panels/Memories';
import Account from './screens/settings/panels/Account';

import DevComponents from './dev/DevComponents';

import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/data/useProfile';
import { Loading } from './components/core/Async';

/** README §8 — the dev gallery stays behind a flag; it never ships in a build. */
const SHOW_DEV = import.meta.env.DEV;

/**
 * Gate for everything inside the app shell.
 *
 * Signed-out visitors are sent to the welcome screen. Registered users who have
 * not finished the wizard are sent to `/setup` — guests are deliberately exempt
 * so "Jump right in!" lands straight on the plan, which is what frame 00b.1
 * draws.
 */
function RequireSession({ children }: { children: ReactNode }) {
  const { status, isGuest } = useAuth();
  const profile = useProfile();
  const location = useLocation();

  if (status === 'loading') return <Loading label="Getting things ready…" padding={80} />;
  if (status === 'signed-out') return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;

  if (!isGuest && profile.isLoading) return <Loading label="Getting things ready…" padding={80} />;
  if (!isGuest && profile.data && profile.data.onboarding_complete === false) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}

/** Entry screens bounce an already-authenticated visitor into the app. */
function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'guest' || status === 'signed-in') return <Navigate to="/plan" replace />;
  return <>{children}</>;
}

/**
 * `/signup` is also the guest **upgrade** path — every "save your progress"
 * CTA points here — so a guest must be let through. Only a fully registered
 * user has nothing to do on this screen.
 */
function AllowGuestUpgrade({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'signed-in') return <Navigate to="/plan" replace />;
  return <>{children}</>;
}

/** `/setup` needs a session (guest or real) but must not be gated on itself. */
function RequireAnySession({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return <Loading label="Getting things ready…" padding={80} />;
  if (status === 'signed-out') return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* ── Entry & Onboarding — no TopNav (README §4.1) ────────────── */}
      <Route element={<AuthShell />}>
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<RedirectIfAuthed><Welcome /></RedirectIfAuthed>} />
        <Route path="/signin" element={<RedirectIfAuthed><SignIn /></RedirectIfAuthed>} />
        <Route path="/signup" element={<AllowGuestUpgrade><SignUp /></AllowGuestUpgrade>} />
        <Route path="/verify" element={<VerifyEmail />} />
        {/* Ungated on purpose — the OAuth round trip lands here before a
            session exists. */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/setup" element={<RequireAnySession><Onboarding /></RequireAnySession>} />
      </Route>

      {/* ── In-app — inside the TopNav shell ────────────────────────── */}
      <Route element={<RequireSession><AppShell /></RequireSession>}>
        <Route path="/plan" element={<Dashboard />} />
        <Route path="/plan/task/:id" element={<Microtasks />} />

        <Route path="/subjects" element={<Subjects />} />
        <Route path="/subjects/semesters" element={<Subjects semestersOpen />} />
        <Route path="/subjects/:id" element={<Subjects />} />

        <Route path="/focus" element={<Focus />} />

        <Route path="/ada" element={<Ada />} />
        <Route path="/ada/:chatId" element={<Ada historyOpen />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/feedback" element={<Feedback />} />
        <Route path="/feedback/:id" element={<SuggestionDetail />} />

        <Route path="/settings" element={<Settings />}>
          <Route index element={<Appearance />} />
          <Route path="tags" element={<StudyTags />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="prism" element={<Prism />} />
          <Route path="import" element={<ImportPanel />} />
          <Route path="memories" element={<Memories />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Route>

      {SHOW_DEV && <Route path="/dev/components" element={<DevComponents />} />}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
