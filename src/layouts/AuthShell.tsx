import { Outlet } from 'react-router-dom';

/* AuthShell — bare shell for Splash, Welcome, Sign in/up, Verify and
   Onboarding. README §4.1: the TopNav is not rendered on any of these. */

export default function AuthShell() {
  return (
    <div
      className="aq-min-width"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--surface-page)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <Outlet />
    </div>
  );
}
