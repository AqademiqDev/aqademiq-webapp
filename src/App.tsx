import { Navigate, Route, Routes } from 'react-router-dom';

import AppShell from './layouts/AppShell';
import AuthShell from './layouts/AuthShell';

import Splash from './screens/entry/Splash';
import Welcome from './screens/entry/Welcome';
import SignIn from './screens/entry/SignIn';
import SignUp from './screens/entry/SignUp';
import VerifyEmail from './screens/entry/VerifyEmail';
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
import Account from './screens/settings/panels/Account';

import DevComponents from './dev/DevComponents';

/** README §8 — the dev gallery stays behind a flag; it never ships in a build. */
const SHOW_DEV = import.meta.env.DEV;

export default function App() {
  return (
    <Routes>
      {/* ── Entry & Onboarding — no TopNav (README §4.1) ────────────── */}
      <Route element={<AuthShell />}>
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/setup" element={<Onboarding />} />
      </Route>

      {/* ── In-app — inside the TopNav shell ────────────────────────── */}
      <Route element={<AppShell />}>
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
          <Route path="account" element={<Account />} />
        </Route>
      </Route>

      {SHOW_DEV && <Route path="/dev/components" element={<DevComponents />} />}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
