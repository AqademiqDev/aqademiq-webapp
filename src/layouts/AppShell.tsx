import { Outlet } from 'react-router-dom';
import TopNav from '../components/nav/TopNav';

/* ─────────────────────────────────────────────────────────────────────────
   AppShell — the persistent TopNav plus the scrolling content area.

   `position: relative` is load-bearing: modals, sheets and popovers are
   absolutely positioned against this box with `inset: 58px 0 0 0` so they
   start below the nav exactly as the frames draw them.
   ───────────────────────────────────────────────────────────────────────── */

export default function AppShell() {
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
      <TopNav />
      <Outlet />
    </div>
  );
}

/**
 * The standard content area: `flex:1; overflow:auto; padding:24px 30px`
 * (README §3), with the per-screen max-width centred inside it.
 */
export function Content({
  maxWidth,
  padding = '24px 30px',
  center = false,
  children,
  style,
}: {
  maxWidth?: number;
  padding?: string | number;
  /** Centres content vertically as well — used by the Focus screens. */
  center?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <main
      className="aq-scroll aq-screen"
      style={{
        flex: 1,
        overflow: 'auto',
        padding,
        display: 'flex',
        flexDirection: 'column',
        ...(center ? { alignItems: 'center', justifyContent: 'center', textAlign: 'center' } : null),
        ...style,
      }}
    >
      {maxWidth ? (
        <div style={{ width: '100%', maxWidth, margin: '0 auto' }}>{children}</div>
      ) : (
        children
      )}
    </main>
  );
}
